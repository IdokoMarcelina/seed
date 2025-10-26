(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-CAMPAIGN-NOT-FOUND (err u101))
(define-constant ERR-DEADLINE-PASSED (err u102))
(define-constant ERR-NOT-ENABLED (err u103))
(define-constant ERR-NOT-OWNER (err u104))
(define-constant ERR-ALREADY-FINALIZED (err u105))
(define-constant ERR-INVALID-TOKEN-TYPE (err u106))
(define-constant ERR-INVALID-GOAL (err u107))
(define-constant ERR-INVALID-DURATION (err u108))

;; Constants for validation
(define-constant MIN-GOAL u1000000) ;; Minimum 1 STX (in microstacks)
(define-constant MAX-GOAL u100000000000000) ;; Maximum 100M STX
(define-constant MIN-DURATION u144) ;; ~1 day (144 blocks)
(define-constant MAX-DURATION u52560) ;; ~1 year (52560 blocks)

;; Campaign structure
(define-map campaigns
  uint
  {
    owner: principal,
    goal: uint,
    deadline: uint,
    raised: uint,
    finalized: bool,
    token-type: uint, ;; u0 for FT, u1 for NFT
  }
)

;; Contributions map
(define-map contributions
  {
    cid: uint,
    backer: principal,
  }
  uint
)

;; FT Ledger
(define-map ft-ledger
  {
    cid: uint,
    owner: principal,
  }
  uint
)

;; NFT Ledger
(define-map nft-owner
  {
    cid: uint,
    token-id: uint,
  }
  principal
)

(define-map next-nft-id
  uint
  uint
)

;; Campaign counter
(define-data-var campaign-id uint u0)

;; Create a new campaign
(define-public (create-campaign
    (goal uint)
    (duration uint)
    (token-type uint)
  )
  (begin
    ;; Validate inputs
    (asserts! (and (>= goal MIN-GOAL) (<= goal MAX-GOAL)) ERR-INVALID-GOAL)
    (asserts! (and (>= duration MIN-DURATION) (<= duration MAX-DURATION))
      ERR-INVALID-DURATION
    )
    (asserts! (or (is-eq token-type u0) (is-eq token-type u1))
      ERR-INVALID-TOKEN-TYPE
    )

    (let (
        (cid (+ (var-get campaign-id) u1))
        (deadline (+ stacks-block-height duration))
      )
      (begin
        (var-set campaign-id cid)
        (map-set campaigns cid {
          owner: tx-sender,
          goal: goal,
          deadline: deadline,
          raised: u0,
          finalized: false,
          token-type: token-type,
        })
        (ok cid)
      )
    )
  )
)

;; Fund a campaign
(define-public (fund
    (cid uint)
    (amount uint)
  )
  (begin
    ;; Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (match (map-get? campaigns cid)
      c (begin
        ;; Check deadline hasn't passed
        (asserts! (<= stacks-block-height (get deadline c)) ERR-DEADLINE-PASSED)

        ;; Transfer STX to contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

        (let (
            (new-raised (+ (get raised c) amount))
            (prev (default-to u0
              (map-get? contributions {
                cid: cid,
                backer: tx-sender,
              })
            ))
          )
          ;; Update raised + contributions
          (map-set campaigns cid {
            owner: (get owner c),
            goal: (get goal c),
            deadline: (get deadline c),
            raised: new-raised,
            finalized: (get finalized c),
            token-type: (get token-type c),
          })
          (map-set contributions {
            cid: cid,
            backer: tx-sender,
          }
            (+ prev amount)
          )

          ;; Mint token
          (if (is-eq (get token-type c) u0)
            ;; FT shares
            (let ((prevb (default-to u0
                (map-get? ft-ledger {
                  cid: cid,
                  owner: tx-sender,
                })
              )))
              (map-set ft-ledger {
                cid: cid,
                owner: tx-sender,
              }
                (+ prevb amount)
              )
              (ok u0)
            )
            ;; NFT mint
            (let ((tid (default-to u1 (map-get? next-nft-id cid))))
              (map-set nft-owner {
                cid: cid,
                token-id: tid,
              }
                tx-sender
              )
              (map-set next-nft-id cid (+ tid u1))
              (ok tid)
            )
          )
        )
      )
      ERR-CAMPAIGN-NOT-FOUND
    )
  )
)

;; Finalize campaign
(define-public (finalize (cid uint))
  (match (map-get? campaigns cid)
    c (begin
      ;; Check if already finalized
      (asserts! (not (get finalized c)) ERR-ALREADY-FINALIZED)

      ;; Check if caller is owner
      (asserts! (is-eq tx-sender (get owner c)) ERR-NOT-OWNER)

      ;; Check if goal reached or deadline passed
      (asserts!
        (or (>= (get raised c) (get goal c)) (> stacks-block-height (get deadline c)))
        ERR-DEADLINE-PASSED
      )

      ;; Transfer funds to owner
      (try! (as-contract (stx-transfer? (get raised c) tx-sender (get owner c))))

      ;; Mark as finalized
      (map-set campaigns cid {
        owner: (get owner c),
        goal: (get goal c),
        deadline: (get deadline c),
        raised: (get raised c),
        finalized: true,
        token-type: (get token-type c),
      })
      (ok true)
    )
    ERR-CAMPAIGN-NOT-FOUND
  )
)

;; Read-only functions for querying data

(define-read-only (get-campaign (cid uint))
  (map-get? campaigns cid)
)

(define-read-only (get-contribution
    (cid uint)
    (backer principal)
  )
  (default-to u0 (map-get? contributions {
    cid: cid,
    backer: backer,
  })
  )
)

(define-read-only (get-ft-balance
    (cid uint)
    (owner principal)
  )
  (default-to u0 (map-get? ft-ledger {
    cid: cid,
    owner: owner,
  })
  )
)

(define-read-only (get-nft-owner
    (cid uint)
    (token-id uint)
  )
  (map-get? nft-owner {
    cid: cid,
    token-id: token-id,
  })
)

(define-read-only (get-campaign-count)
  (var-get campaign-id)
)