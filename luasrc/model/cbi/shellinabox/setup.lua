-- Copyright 2018 Anton Kikin (a.kikin@tano-systems.com)

local fs = require("nixio.fs")

local m, s, o

m = Map("shellinabox", translate("Terminal settings"))

s = m:section(TypedSection, "server")
s.anonymous = true
s.addremove = false

s:tab("basic", translate("Basic Settings"))
s:tab("ssl", translate("SSL Settings"))

---------------------------

o = s:taboption("basic", Value, "port",
	translate("Port"),
	translate("Port to listen (default: 4200)"))

o.default = 4200
o.datatype = "port"
o.rmempty = true
o.placeholder = 4200

o = s:taboption("basic", Flag, "no_beep",
	translate("Suppress all audio output"))

o.default = true

---------------------------

local ssl = nil
local ssl_cert = nil

-- Enable SSL
ssl = s:taboption("ssl", Flag, "ssl",
	translate("Enable SSL"))

function ssl.validate(self, value, section)
	if ssl and ssl:formvalue(section) and (#(ssl:formvalue(section)) > 0) then
		if ((not ssl_cert) or
		    (not ssl_cert:formvalue(section)) or
		    (ssl_cert:formvalue(section) == "")) then
			return nil, translate("Must have certificate when using SSL")
		end
	end

	return value
end

-- SSL certificate file path
ssl_cert = s:taboption("ssl", FileUpload, "ssl_cert",
	translate("HTTPS certificate (PEM&nbsp;format)"),
	translate("SSL certificate file path"))
	
ssl_cert:depends("ssl", 1)
ssl_cert.default = '/etc/shellinabox/ssl/certificate.pem'

o = s:taboption("ssl", Button, "remove_ssl_cert",
	translate("Remove SSL certificate"),
	translate("Terminal server will generate a new self-signed certificate"))

o.inputstyle = "remove"
o:depends("ssl", 1)

function o.write(self, section)
	if ssl_cert:cfgvalue(section) and fs.access(ssl_cert:cfgvalue(section)) then
		fs.unlink(ssl_cert:cfgvalue(section))
	end

	luci.sys.call("/etc/init.d/shellinabox restart")
	luci.http.redirect(luci.dispatcher.build_url("admin", "system", "shellinabox", "configure"))
end

---------------------------

return m
