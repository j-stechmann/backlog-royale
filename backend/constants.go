package main

const (
	RolePlayer = "player"
	RoleDealer = "dealer"
	RoleAFK    = "afk"
)

const (
	ActionVote       = "VOTE"
	ActionReveal     = "REVEAL"
	ActionReset      = "RESET"
	ActionToggleRole = "TOGGLE_ROLE"
	ActionToggleAFK  = "TOGGLE_AFK"
)

const (
	MessageTypeState   = "STATE"
	MessageTypeWelcome = "WELCOME"
)

// MaxRoomNameLength caps the user-supplied room identifier accepted by
// the /ws endpoint (counted in Unicode characters, not bytes). Mirrors
// the join form's maxLength in the frontend.
const MaxRoomNameLength = 40
