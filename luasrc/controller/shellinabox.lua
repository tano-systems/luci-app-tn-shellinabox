-- Copyright 2018 Anton Kikin (a.kikin@tano-systems.com)

module("luci.controller.shellinabox", package.seeall)

local fs    = require("nixio.fs")
local util  = require("luci.util")
local tmpl  = require("luci.template")
local i18n  = require("luci.i18n")

function index()
	if not nixio.fs.access("/etc/config/shellinabox") then
		nixio.fs.writefile("/etc/config/shellinabox", "")
	end

	-- menu items
	entry({"admin", "system", "shellinabox"}, firstchild(), _("Terminal"), 80)
	entry({"admin", "system", "shellinabox", "terminal"}, call("view_terminal"), _("Terminal"), 10)
	entry({"admin", "system", "shellinabox", "configure"}, cbi("shellinabox/setup"), _("Setup"), 20)

	-- actions
	entry({"admin", "system", "shellinabox", "start"}, call("action_start"))
end

function view_terminal()
	local is_running = luci.sys.exec("/etc/init.d/shellinabox status")

	local uci  = require "luci.model.uci".cursor()
	local ssl  = uci:get("shellinabox", "server", "ssl") or "0"
	local port = uci:get("shellinabox", "server", "port") or "4200"

	tmpl.render("shellinabox/terminal", {
		is_running = tonumber(is_running),
		ssl = tonumber(ssl),
		port = tonumber(port)
	})
end

function action_start()
	local http = require "luci.http"
	luci.sys.init.start("shellinabox")
	http.redirect(luci.dispatcher.build_url('admin/system/shellinabox/terminal'))
end
