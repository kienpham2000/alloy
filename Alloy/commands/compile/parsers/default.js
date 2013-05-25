var CU = require('../compilerUtils'),
	U = require('../../../utils'),
	styler = require('../styler'),
	CONST = require('../../../common/constants'),
	_ = require('../../../lib/alloy/underscore')._;

exports.parse = function(node, state) {
	return require('./base').parse(node, state, parse);
};

function parse(node, state, args) {
	var createFunc = 'create' + node.nodeName,
		isCollectionBound = args[CONST.BIND_COLLECTION] ? true : false,
		fullname = CU.getNodeFullname(node),
		generatedStyle = styler.generateStyleParams(
			state.styles,
			args.classes,
			args.id,
			fullname,
			_.defaults(state.extraStyle || {}, args.createArgs || {}),
			state
		),
		code = '';

	// make symbol a local variable if necessary
	if (state.local) {
		args.symbol = CU.generateUniqueId();
	}

	// Generate runtime code
	if (state.isViewTemplate) {
		var bindId = node.getAttribute('bindId');
		code += (state.local ? 'var ' : '') + args.symbol + '={';
		code += "type:'" + fullname + "',"; 
		if (bindId) {
			code += "bindId:'" + bindId + "',";
		}

		// apply usual style properties
		var argsObject = { properties: generatedStyle };

		// add in any events on the ItemTemplate
		if (args.events && args.events.length > 0) {
			argsObject.events = '{' + _.reduce(args.events, function(memo,o) {
				return memo + o.name + ':' + o.value + ',';
			}, '') + '}';
		}

		var children = U.XML.getElementsFromNodes(node.childNodes);
		var childTemplates;
		if (children.length > 0) {
			childTemplates = CU.generateUniqueId();
			code += 'var ' + childTemplates + '=[];'; 

			_.each(children, function(child) {
				code += CU.generateNodeExtended(child, state, {
					parent: {},
					local: true,
					isViewTemplate: true,
					post: function(node, state, args) {
						return childTemplates + '.push(' + state.item.symbol + ');';
					}
				});
			});

			argsObject.childTemplates = childTemplates;
		}

		// add the additional arguments to the code
		code += _.reduce(argsObject, function(memo,v,k) {
			return memo + k + ':' + v + ',';
		}, '');

		code += '};';
	} else {
		var module = node.getAttribute('module');
		if (module) {
			createFunc = node.getAttribute('method') || 'createView';
			args.ns = 'require("'+module+'")';
			delete args.createArgs['module'];
			delete args.createArgs['method'];
		}

		code += (state.local ? 'var ' : '') + args.symbol + " = " + args.ns + "." + createFunc + "(\n";
		code += styler.generateStyleParams(
			state.styles,
			args.classes,
			args.id,
			fullname,
			_.defaults(state.extraStyle || {}, args.createArgs || {}),
			state
		) + '\n';
		code += ");\n";
		if (args.parent.symbol) {
			code += args.parent.symbol + ".add(" + args.symbol + ");\n";
		}

		if (isCollectionBound) {
			var localModel = CU.generateUniqueId();
			var itemCode = '';

			_.each(U.XML.getElementsFromNodes(node.childNodes), function(child) {
				itemCode += CU.generateNodeExtended(child, state, {
					parent: {
						node: node,
						symbol: args.symbol
					},
					local: true,
					model: localModel
				});
			});

			var pre =  "var children = " + args.symbol + ".children;" +
					   "for (var d = children.length-1; d >= 0; d--) {" + 
					   "	" + args.symbol + ".remove(children[d]);" +
					   "}";

			code += _.template(CU.generateCollectionBindingTemplate(args), {
				localModel: localModel,
				pre: pre,
				items: itemCode,
				post: ''
			});
		}
	}

	// Update the parsing state
	var ret = {
		isViewTemplate: state.isViewTemplate || false,
		local: state.local || false,
		model: state.model || undefined,
		condition: state.condition || undefined,
		styles: state.styles,
		code: code
	};
	var nextObj = {
		node: node,
		symbol: args.symbol
	};

	if (state.isViewTemplate) {
		return _.extend(ret, { item: nextObj });
	} else {
		return _.extend(ret, { parent: isCollectionBound ? {} : nextObj });
	}

	return ret;
};