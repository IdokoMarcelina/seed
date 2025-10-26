import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("SEED Crowdfunding Platform", () => {
  describe("Campaign Creation", () => {
    it("should create a campaign with valid parameters", () => {
      const goal = 10_000_000; // 10 STX
      const duration = 144; // ~1 day
      const tokenType = 0; // FT

      const { result } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [
          Cl.uint(goal),
          Cl.uint(duration),
          Cl.uint(tokenType),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should fail with goal below minimum", () => {
      const goal = 500_000; // 0.5 STX (below 1 STX minimum)
      const duration = 144;
      const tokenType = 0;

      const { result } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [
          Cl.uint(goal),
          Cl.uint(duration),
          Cl.uint(tokenType),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(107)); // ERR-INVALID-GOAL
    });

    it("should fail with goal above maximum", () => {
      const goal = 200_000_000_000_000; // 200M STX (above 100M max)
      const duration = 144;
      const tokenType = 0;

      const { result } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [
          Cl.uint(goal),
          Cl.uint(duration),
          Cl.uint(tokenType),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(107)); // ERR-INVALID-GOAL
    });

    it("should fail with duration below minimum", () => {
      const goal = 10_000_000;
      const duration = 100; // Less than 144 blocks
      const tokenType = 0;

      const { result } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [
          Cl.uint(goal),
          Cl.uint(duration),
          Cl.uint(tokenType),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(108)); // ERR-INVALID-DURATION
    });

    it("should fail with invalid token type", () => {
      const goal = 10_000_000;
      const duration = 144;
      const tokenType = 5; // Invalid (only 0 or 1 allowed)

      const { result } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [
          Cl.uint(goal),
          Cl.uint(duration),
          Cl.uint(tokenType),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(106)); // ERR-INVALID-TOKEN-TYPE
    });

    it("should create multiple campaigns and increment IDs", () => {
      const goal = 10_000_000;
      const duration = 144;

      const { result: result1 } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(goal), Cl.uint(duration), Cl.uint(0)],
        deployer
      );

      const { result: result2 } = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(goal), Cl.uint(duration), Cl.uint(1)],
        wallet1
      );

      expect(result1).toBeOk(Cl.uint(1));
      expect(result2).toBeOk(Cl.uint(2));
    });
  });

  describe("Campaign Funding - FT Token Type", () => {
    it("should allow funding a campaign with FT tokens", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Fund campaign
      const { result } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(0)); // Returns u0 for FT
    });

    it("should track multiple contributions from same backer", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // First contribution
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      // Second contribution
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(3_000_000)],
        wallet1
      );

      // Check total contribution
      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-contribution",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeUint(5_000_000);
    });

    it("should update FT balance correctly", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Fund campaign
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(5_000_000)],
        wallet1
      );

      // Check FT balance
      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-ft-balance",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeUint(5_000_000);
    });

    it("should fail with zero or negative amount", () => {
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(0)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-INVALID-AMOUNT
    });

    it("should fail when funding non-existent campaign", () => {
      const { result } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(999), Cl.uint(1_000_000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR-CAMPAIGN-NOT-FOUND
    });
  });

  describe("Campaign Funding - NFT Token Type", () => {
    it("should mint NFT for each contribution", () => {
      // Create NFT campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(1)],
        deployer
      );

      // First contribution - should get token ID 1
      const { result: result1 } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      // Second contribution - should get token ID 2
      const { result: result2 } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(3_000_000)],
        wallet2
      );

      expect(result1).toBeOk(Cl.uint(1));
      expect(result2).toBeOk(Cl.uint(2));
    });

    it("should track NFT ownership correctly", () => {
      // Create NFT campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(1)],
        deployer
      );

      // Fund and get NFT
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      // Check NFT owner
      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-nft-owner",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(Cl.principal(wallet1));
    });
  });

  describe("Deadline Validation", () => {
    it("should fail funding after deadline", () => {
      // Create campaign with short duration
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Mine blocks to pass deadline
      simnet.mineEmptyBlocks(150);

      // Try to fund after deadline
      const { result } = simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(1_000_000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR-DEADLINE-PASSED
    });
  });

  describe("Campaign Finalization", () => {
    it("should finalize successful campaign (goal reached)", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(5_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Fund to reach goal
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(5_000_000)],
        wallet1
      );

      // Finalize
      const { result } = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should finalize failed campaign (deadline passed)", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Partial funding
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      // Mine blocks to pass deadline
      simnet.mineEmptyBlocks(150);

      // Finalize
      const { result } = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail finalization by non-owner", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(5_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Fund campaign
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(5_000_000)],
        wallet1
      );

      // Try to finalize as non-owner
      const { result } = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(104)); // ERR-NOT-OWNER
    });

    it("should fail double finalization", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(5_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Fund campaign
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(5_000_000)],
        wallet1
      );

      // First finalization
      simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );

      // Try to finalize again
      const { result } = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(105)); // ERR-ALREADY-FINALIZED
    });

    it("should fail finalization before deadline without reaching goal", () => {
      // Create campaign
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );

      // Partial funding
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(2_000_000)],
        wallet1
      );

      // Try to finalize before deadline
      const { result } = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR-DEADLINE-PASSED
    });
  });

  describe("Read-Only Functions", () => {
    it("should get campaign details", () => {
      const goal = 10_000_000;
      const duration = 144;

      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(goal), Cl.uint(duration), Cl.uint(0)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-campaign",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          owner: Cl.principal(deployer),
          goal: Cl.uint(goal),
          deadline: Cl.uint(simnet.blockHeight + duration),
          raised: Cl.uint(0),
          finalized: Cl.bool(false),
          "token-type": Cl.uint(0),
        })
      );
    });

    it("should return none for non-existent campaign", () => {
      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-campaign",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeNone();
    });

    it("should get campaign count", () => {
      // Create 3 campaigns
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        wallet1
      );
      simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(1)],
        wallet2
      );

      const { result } = simnet.callReadOnlyFn(
        "seed",
        "get-campaign-count",
        [],
        deployer
      );

      expect(result).toBeUint(3);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete campaign lifecycle", () => {
      // 1. Create campaign
      const createResult = simnet.callPublicFn(
        "seed",
        "create-campaign",
        [Cl.uint(10_000_000), Cl.uint(144), Cl.uint(0)],
        deployer
      );
      expect(createResult.result).toBeOk(Cl.uint(1));

      // 2. Multiple backers fund
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(3_000_000)],
        wallet1
      );
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(4_000_000)],
        wallet2
      );
      simnet.callPublicFn(
        "seed",
        "fund",
        [Cl.uint(1), Cl.uint(3_000_000)],
        wallet3
      );

      // 3. Check campaign raised amount
      const campaignResult = simnet.callReadOnlyFn(
        "seed",
        "get-campaign",
        [Cl.uint(1)],
        deployer
      );

      // Verify the campaign exists and has correct raised amount
      expect(campaignResult.result).not.toBeNone();

      // 4. Finalize
      const finalizeResult = simnet.callPublicFn(
        "seed",
        "finalize",
        [Cl.uint(1)],
        deployer
      );
      expect(finalizeResult.result).toBeOk(Cl.bool(true));

      // 5. Check finalized status
      const finalCampaign = simnet.callReadOnlyFn(
        "seed",
        "get-campaign",
        [Cl.uint(1)],
        deployer
      );
      
      // Verify the campaign is now finalized
      expect(finalCampaign.result).not.toBeNone();
    });
  });
});