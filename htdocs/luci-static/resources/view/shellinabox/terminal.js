/*
 * Copyright (c) 2020 Tano Systems LLC. All Rights Reserved.
 * Author: Anton Kikin <a.kikin@tano-systems.com>
 */

'use strict';
'require form';
'require uci';

var dataMap = {
	terminal: {
		iframe: null,
		button: null,
		message: null
	}
};

var css = '                               \
	#shellinabox-terminal-container {     \
		border: 1px solid #aaa;           \
		background-color: #eee;           \
		height: 532px;                    \
		padding-bottom: 18px;             \
		width: 100%;                      \
		overflow-x: auto;                 \
		overflow-y: hidden;               \
		resize: vertical;                 \
		margin-bottom: 16px;              \
	}                                     \
	                                      \
	#shellinabox-terminal {               \
		width: 100%;                      \
		height: 100%;                     \
		border: none;                     \
	}                                     \
';

return L.view.extend({
	load: function() {
		return uci.load('shellinabox');
	},

	render: function(data) {
		var m, s, o;

		var ssl      = uci.get('shellinabox', 'server', 'ssl');
		var port     = uci.get('shellinabox', 'server', 'port');
		var hostname = window.location.hostname;

		var terminal_link =
			((ssl == '1') ? 'https://' : 'http://') +
			hostname + ':' + port;

		m = new form.JSONMap(dataMap, _('Web Terminal'));

		s = m.section(form.NamedSection, 'terminal', 'terminal');

		o = s.option(form.DummyValue, 'iframe');
		o.render = function() {
			var protocol = window.location.protocol;

			if ((ssl == '0') && (protocol === 'https:')) {
				return E('div', { 'class': 'alert-message warning' }, [
					E('h4', {}, _('Can\'t load non-SSL terminal into page loaded over HTTPS')),
					E('p', {},
						_('You can enable SSL in <a href="%s">terminal settings</a> ' +
						  'page or use HTTP connection instead of HTTPS. Also you ' +
						  'can open terminal in a separate window using the appropriate ' +
						  'button below.').format(L.url('admin/system/shellinabox/config'))
					)
				]);
			}

			var iframe = E('iframe', {
				'id': 'shellinabox-terminal',
				'src': terminal_link
			});

			return E('div', {}, [
				E('style', { 'type': 'text/css' }, [ css ]),
				E('div', { 'id': 'shellinabox-terminal-container' }, iframe)
			]);
		};

		o = s.option(form.Button, 'button');
		o.inputtitle = _('Open terminal in a separate window');
		o.inputstyle = 'action';
		o.renderWidget = function(section_id, option_index, cfgvalue) {
			return E('div', {}, [
				E('a', {
					'class'   : 'cbi-button cbi-button-%s'.format(this.inputstyle || 'button'),
					'target'  : 'blank',
					'href'    : terminal_link,
					'disabled': ((this.readonly != null) ? this.readonly : this.map.readonly) || null
				}, this.inputtitle)
			]);
		};

		if (ssl == '1') {
			o = s.option(form.DummyValue, 'message');
			o.render = function() {
				return E('div', { 'class': 'alert-message' },
					_('If terminal is not displayed and you are using self-signed ' +
					  'SSL certificate may you need to open terminal in a separate ' +
					  'browser window using the appropriate button above and ' +
					  'approve the certificate manually. After approving the ' +
					  'certificate you need to reload this page or use terminal ' +
					  'in opened window.'));
			};
		};

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
