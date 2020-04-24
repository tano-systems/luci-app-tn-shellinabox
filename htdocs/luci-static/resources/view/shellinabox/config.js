/*
 * Copyright (c) 2020 Tano Systems LLC. All Rights Reserved.
 * Author: Anton Kikin <a.kikin@tano-systems.com>
 */

'use strict';
'require rpc';
'require form';
'require uci';
'require fs';
'require ui';

var callInitAction = rpc.declare({
	object: 'luci',
	method: 'setInitAction',
	params: [ 'name', 'action' ],
	expect: { result: false }
});

return L.view.extend({
	load: function() {
		return uci.load('shellinabox');
	},

	render: function(data) {
		var m, s, o;

		m = new form.Map('shellinabox', _('Web Terminal Settings'));

		s = m.section(form.TypedSection, 'server');
		s.addremove = false;
		s.anonymous = true;

		s.tab('basic', _('Basic Settings'));
		s.tab('ssl', _('SSL Settings'));

		// ---------------------------

		o = s.taboption('basic', form.Value, 'port',
			_('Port'),
			_('Port to listen (default: 4200)'));

		o.default = '4200';
		o.datatype = 'port';
		o.rmempty = true;
		o.placeholder = '4200';

		o = s.taboption('basic', form.Flag, 'no_beep',
			_('Suppress all audio output'))

		o.rmempty = false;
		o.optional = false;
		o.default = '1';

		// ---------------------------

		var ssl;
		var ssl_cert;

		// Enable SSL
		ssl = s.taboption('ssl', form.Flag, 'ssl',
			_('Enable SSL'))

		// SSL certificate file path
		ssl_cert = s.taboption('ssl', form.FileUpload, 'ssl_cert',
			_('HTTPS certificate (PEM&nbsp;format)'),
			_('File file must contain private key and certificate parts.'));
			
		ssl_cert.root_directory = '/etc/shellinabox/ssl';
		ssl_cert.depends('ssl', '1');
		ssl_cert.default = '/etc/shellinabox/ssl/certificate.pem';

		o = s.taboption('ssl', form.Button, 'remove_ssl_cert',
			_('Regenerate SSL certificate'),
			_('Terminal server will delete current certificate file and generate a new self-signed certificate'));

		o.inputstyle = 'remove';
		o.depends('ssl', '1');
		o.write = function() {};
		o.onclick = L.bind(function(m, ev, section_id) {
			var file = ssl_cert.formvalue(section_id);
			return fs.remove(ssl_cert.formvalue(section_id))
				.then(function() {
					return callInitAction('shellinabox', 'restart');
				})
				.then(L.bind(function(m) {
					return new Promise(function(resolveFn, rejectFn) {
						setTimeout(function() {
							resolveFn(m.render());
						}, 2000);
					});
				}, this, m))
				.catch(function(e) {
					ui.addNotification(null, E('p',
						_('Failed to regenerate SSL certificate:') + ' ' + e.message), 'error');
				});
		}, o, m);

		// ---------------------------

		return m.render();
	}
});
