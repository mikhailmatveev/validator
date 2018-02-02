/**
 * @module Validator Validates any <input> or <textarea> at specified context
 * and checks for equality field values.
 *
 * @author mikhailmatveev
 * @see https://github.com/mikhailmatveev
 */
var Validator = (function() {

    var validator = {};

    // Element.matches() polyfill
    (function(e) {
        e.matches || (e.matches = e.matchesSelector || function(selector) {
            var matches = document.querySelectorAll(selector),
                th = this;
            return Array.prototype.some.call(matches, function(e) {
                return e === th;
            });
        });
    })(Element.prototype);

    // Element.closest() polyfill
    (function(e) {
        e.matches = e.matches || e.mozMatchesSelector || e.msMatchesSelector || e.oMatchesSelector || e.webkitMatchesSelector;
        e.closest = e.closest || function closest(selector) {
            if (!this) return null;
            if (this.matches(selector)) return this;
            if (!this.parentElement) { return null } else return this.parentElement.closest(selector)
        };
    }(Element.prototype));

    // helper functions for objects check

    function isArray(o) { return {}.toString.call(o) === '[object Array]'; };

    function isBoolean(o) { return {}.toString.call(o) === '[object Boolean]'; };

    function isFunction(o) { return {}.toString.call(o) === '[object Function]'; };

    function isHTMLDocument(o) { return isNode(o) && toString.call(o) === '[object HTMLDocument]'; };

    function isHTMLElement(o) { return isNode(o) && toString.call(o) === '[object HTMLElement]'; };

    function isHTMLInputElement(o) { return isNode(o) && toString.call(o) === '[object HTMLInputElement]'; };

    function isHTMLTextAreaElement(o) { return isNode(o) && toString.call(o) === '[object HTMLTextAreaElement]'; };

    function isNode(o) { return o instanceof Node; };

    function isNodeList(o) { return o instanceof NodeList; };

    function isNull(o) { return o === null; };

    function isNumber(o) { return {}.toString.call(o) === '[object Number]'; };

    function isObject(o) { return {}.toString.call(o) === '[object Object]'; };

    function isString(o) { return {}.toString.call(o) === '[object String]'; };

    function isUndefined(o) { return o === undefined; };

    // validator methods

    validator.resetField = function(field) {

        var err,
            messages,
            fg,
            parent,
            style;

        if (field && (isHTMLInputElement(field) || isHTMLTextAreaElement(field))) {
            fg = field.closest('.form-group'); // for Bootstrap controls
            parent = field.parentNode;
            style = field.style;
            if (fg) { // Bootstrap case
                if (fg.classList.contains('has-error')) {
                    fg.classList.remove('has-error');
                }
                messages = isNode(fg) ? fg.querySelectorAll('.text-invalid') : [];
                if (messages.length > 0) {
                    messages.forEach(function(msg) { fg.removeChild(msg); });
                }
            } else { // other cases
                err = parent.classList.contains('invalid') ? parent : undefined;
                if (err && err.parentNode) {
                    // replace to back state node
                    err.parentNode.replaceChild(field, err);
                    // back state styles for field
                    field.style = style;
                }
            }
        }
    };

    validator.validateField = function(field, callback) {

        var messages, minlength, pattern, regexes = {
                // The expression with the best score is currently the one used by PHP's filter_var(),
                // which is based on a regex by Michael Rushton (https://fightingforalostcause.net/content/misc/2006/compare-email-regex.php)
                email: /^(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){255,})(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){65,}@)(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22))(?:\.(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22)))*@(?:(?:(?!.*[^.]{64,})(?:(?:(?:xn--)?[a-z0-9]+(?:-[a-z0-9]+)*\.){1,126}){1,}(?:(?:[a-z][a-z0-9]*)|(?:(?:xn--)[a-z0-9]+))(?:-[a-z0-9]+)*)|(?:\[(?:(?:IPv6:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})|(?:(?!(?:.*[a-f0-9][:\]]){7,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?)))|(?:(?:IPv6:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){5}:)|(?:(?!(?:.*[a-f0-9]:){5,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3}:)?)))?(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))(?:\.(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))){3}))\]))$/i,
                ip: /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
                phone: /^(\([0-9]{3}\)\s*|[0-9]{3}\-)[0-9]{3}-[0-9]{4}$/,
                // Regular Expression for URL validation
                //
                // Author: Diego Perini
                // Updated: 2010/12/05
                // License: MIT
                //
                // Copyright (c) 2010-2013 Diego Perini (http://www.iport.it)
                url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i
            },
            results = [];

        // helper validation function
        function validate(field, predicate, callback, message) {
            if (!predicate) {
                if (callback && isFunction(callback)) { callback(field, message); }
            }
            return predicate;
        };

        if (field && (isHTMLInputElement(field) || isHTMLTextAreaElement(field))) {
            // if field has data-validator-messages attribute
            if (field.hasAttribute('data-validator-messages')) {
                messages = JSON.parse(field.getAttribute('data-validator-messages'));
            }
            // validate for required of this field
            if (field.hasAttribute('required')) {
                results.push(validate(
                    field,
                    field.value.length !== 0,
                    callback,
                    messages && messages.required ? messages.required : undefined
                ));
            }
            // validate for minimum length of this field
            minlength = field.hasAttribute('minlength') ?
                field.getAttribute('minlength') :
                undefined;
            // minlength must be exist and have a string type
            if (minlength && isString(minlength)) {
                results.push(validate(
                    field,
                    field.value.length >= minlength,
                    callback,
                    messages && messages.minlength ? messages.minlength : undefined
                ));
            }
            // validate pattern for this field, if exists
            pattern = field.hasAttribute('data-validator-pattern') ?
                field.getAttribute('data-validator-pattern') :
                undefined;
            // pattern must be exist and have a string type
            if (pattern && isString(pattern)) {
                // throw error, if pattern is not valid
                if (!regexes.hasOwnProperty(pattern)) {
                    throw new Error('[' + pattern + ']: invalid validation pattern!');
                }
                // push to result validation array for this field
                results.push(validate(
                    field,
                    regexes[pattern].test(field.value),
                    callback,
                    messages && messages.pattern ? messages.pattern : undefined
                ));
            }
            // result validation array
            return results.every(function(each) { return each === true; });
        }
        // if this field is not <input> or not <textarea>, - return false
        return false;
    };

    /**
     * Validates each field whose name is specified in the "options" parameter
     *
     * @param {object} context The closest DOM node, containing <input> or
     * <textarea> elements for validation
     *
     * @param {object} options Validation config. List of fields for validation
     * and list of fields for equality checking
     *
     * @returns {boolean} The result of validation
     */
    validator.validate = function(context, options) {

        var equals,
            fields,
            results = [];

        // if field is invalid, - call this function with given message
        function callback(field, message) {

            var err,
                messages,
                fg,
                next,
                parent;

            if (field && (isHTMLInputElement(field) || isHTMLTextAreaElement(field))) {
                fg = field.closest('.form-group'); // for Bootstrap controls
                next = field.nextSibling;
                parent = field.parentNode;
                if (fg) { // Bootstrap case
                    if (!fg.classList.contains('has-error')) {
                        fg.classList.add('has-error');
                    }
                    messages = fg.querySelectorAll('.text-invalid') || [];
                    if (messages.length === 0) {
                        showMessage(fg, message);
                    }
                } else { // other cases
                    err = parent.classList.contains('invalid') ? parent : undefined;
                    if (!err) {
                        // <div>-обертка для инпута с ошибкой (оборачивается в <div> только тот инпут, в котором возникла ошибка)
                        err = document.createElement('div');
                        err.classList.add('invalid');
                        err.appendChild(field);
                        showMessage(err, message);
                        // Вставка в то место, где был исходный инпут
                        // Иначе - вставить в конец
                        if (next) {
                            parent.insertBefore(err, next);
                        } else {
                            parent.appendChild(err);
                        }
                    }
                }
            }
        };

        // helper function for find nodes
        function findNodes(items) {
            var fields = [];
            items.forEach(function(item) {
                var nodes;
                if (isString(item)) {
                    nodes = context.querySelectorAll('[name="' + item + '"]');
                    if (isNodeList(nodes) && nodes.length > 0 && (isHTMLInputElement(nodes[0]) || isHTMLTextAreaElement(nodes[0]))) {
                        fields.push(nodes[0]);
                    }
                }
            });
            return fields;
        };

        // helper function for message showing
        function showMessage(node, message) {
            var e;
            if (isNode(node) && message && isString(message)) {
                e = document.createElement('p');
                e.classList.add('text-invalid');
                e.innerText = message;
                node.appendChild(e);
            }
        };

        // validate by context
        if (window && window.document && isNode(context)) {
            // options.fields
            if (options.fields && isArray(options.fields) && options.fields.length > 0) {
                // find <input> and <textarea> elements only in the DOM
                fields = findNodes(options.fields);
                // validate fields
                if (isArray(fields) && fields.length > 0) {
                    // reset validation state for each field
                    fields.forEach(function(field) {
                        validator.resetField(field);
                    });
                    // validate each field
                    fields.forEach(function(field) {
                        results.push(validator.validateField(field, callback));
                    });
                }
            }
            // options.equals
            if (options.equals && isArray(options.equals) && options.equals.length > 0) {
                // find <input> and <textarea> elements only in the DOM
                equals = findNodes(options.equals);
                // check for fields match
                if (isArray(equals) && equals.length > 0) {
                    // check if fields are equals
                    var matches = !isNaN(equals.reduce(function(a, b) { return (a.value === b.value) ? a.value : NaN; }));
                    if (!matches) {
                        equals.forEach(function(each) {
                            var messages;
                            if (each.hasAttribute('data-validator-messages')) {
                                messages = JSON.parse(each.getAttribute('data-validator-messages'));
                                callback(each, messages && messages.equals ? messages.equals : undefined);
                            }
                        });
                    }
                    results.push(matches);
                }
            }
        }
        // return result validation array
        return results.every(function(each) { return each === true; });
    };

    return {
        validate: validator.validate
    };

}());
