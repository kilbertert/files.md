package tg

import tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

type FakeUpd struct {
	userID           int64
	cmd              Cmd
	Msg              string
	PhotoID          string
	PhotoCaption     string
	ReplyToMessageID int
	IsSentViaBotVal  bool
	InlineQueryVal   string
	IsInlineQueryVal bool
}

func NewFakeUpd(userID int64, msg string) *FakeUpd {
	return &FakeUpd{
		userID:           userID,
		Msg:              msg,
		ReplyToMessageID: -1,
		IsSentViaBotVal:  false,
		InlineQueryVal:   "",
		IsInlineQueryVal: false,
	}
}

func NewFakeUpdCmd(id int64, cmd Cmd) *FakeUpd {
	return &FakeUpd{userID: id, cmd: cmd}
}

func (u *FakeUpd) MsgText() string {
	return u.Msg
}

func (u *FakeUpd) UserID() int64 {
	return u.userID
}

func (u *FakeUpd) Cmd() *Cmd {
	if u.cmd.Name == "" {
		return nil
	}

	return &u.cmd
}

func (u *FakeUpd) MsgEntities() []tgbotapi.MessageEntity {
	return nil
}

func (u *FakeUpd) CaptionEntities() []tgbotapi.MessageEntity {
	return nil
}

func (u *FakeUpd) CallbackQueryID() (string, bool) {
	return "", true
}

func (u *FakeUpd) InlineQueryID() (string, bool) {
	return "", false
}

func (u *FakeUpd) InlineQuery() (string, bool) {
	return u.InlineQueryVal, u.IsInlineQueryVal
}

func (u *FakeUpd) InlineQueryOffset() int {
	return 0
}

func (u *FakeUpd) IsForwarded() bool {
	return false
}

func (u *FakeUpd) IsSentViaBot() bool {
	return u.IsSentViaBotVal
}

func (u *FakeUpd) ReplyToMsgID() (int, bool) {
	return u.ReplyToMessageID, u.ReplyToMessageID != -1
}

func (u *FakeUpd) PhotoOrImageID() (string, bool) {
	if u.PhotoID != "" {
		return u.PhotoID, true
	}

	return "", false
}

func (u *FakeUpd) Caption() string {
	return u.PhotoCaption
}
