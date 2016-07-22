window.Modules = {};

(function(Modules) {
    "use strict";

    Modules['toggle'] = function() {
        this.start = function(element) {
            element.on('click', '.js-toggle', toggle);
            function toggle(event) {
                element.find('.js-toggle-target').toggleClass('hide');
                element.find('input, textarea').first().focus();
                event.preventDefault();
            }
        };
    };

    Modules['label-toggle'] = function() {
        this.start = function(element) {
            element.on('click', '.js-label-toggle', toggle);
            function toggle(event) {
                var $label = $(event.target);
                $label.toggleClass('active-label');
            }
        };
    };

    Modules['filterable-list'] = function() {
        var that = this;
        that.start = function(element) {

            var listInput = element.find('.js-filter-list-input'),
                rows = element.find('li'),
                listCount = element.find('.js-filter-list-count'),
                filterForm;

            element.on('keyup change', '.js-filter-list-input', filterListBasedOnInput);
            filterListBasedOnInput();

            if (element.find('a.js-open-on-submit').length > 0) {
                filterForm = listInput.parents('form');
                if (filterForm && filterForm.length > 0) {
                    filterForm.on('submit', openFirstVisibleLink);
                }
            }

            function filterListBasedOnInput() {
                var searchString = $.trim(listInput.val()),
                    regExp = new RegExp("^" + escapeStringForRegexp(searchString), 'i'),
                    count = 0,
                    countText;

                rows.each(function() {
                    var row = $(this);
                    if (row.data('text').search(regExp) > -1) {
                        row.removeClass('hide');
                        count = count + 1;
                    } else {
                        row.addClass('hide');
                    }
                });

                countText = count == 1 ? listCount.data('singular') : listCount.data('plural');
                listCount.text(count + ' ' + countText);
            }

            function openFirstVisibleLink(evt) {
                evt.preventDefault();
                var link = element.find('a.js-open-on-submit:visible').first();
                window.app.redirect(link.attr('href'));
            }

            // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
            // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
            // Escape ~!@#$%^&*(){}[]`/=?+\|-_;:'",<.>
            function escapeStringForRegexp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
        }
    };

    Modules['filterable-table'] = function() {
        var that = this;
        that.start = function(element) {

            var tableInput,
                tableCount,
                filterForm;

            element.on('keyup change', '.js-filter-table-input', filterTableBasedOnInput);
            filterTableBasedOnInput();

            if (element.find('a.js-open-on-submit').length > 0) {
                tableInput = element.find('.js-filter-table-input'),
                filterForm = tableInput.parents('form');
                if (filterForm && filterForm.length > 0) {
                    filterForm.on('submit', openFirstVisibleLink);
                }
            }

            function filterTableBasedOnInput() {
                var rows = element.find('tbody tr'),
                    tableInput = element.find('.js-filter-table-input'),
                    tableCount = element.find('.js-filter-table-count'),
                    searchString = $.trim(tableInput.val()),
                    regExp = new RegExp(escapeStringForRegexp(searchString), 'i'),
                    count = 0,
                    countText;

                rows.each(function() {
                    var row = $(this);
                    if (row.text().search(regExp) > -1) {
                        row.show();
                        count = count + 1;
                    } else {
                        row.hide();
                    }
                });

                if (tableCount.length > 0) {
                    countText = count == 1 ? tableCount.data('singular') : tableCount.data('plural');
                    tableCount.text(count + ' ' + countText);
                }
            }

            function openFirstVisibleLink(evt) {
                evt.preventDefault();
                var link = element.find('a.js-open-on-submit:visible').first();
                window.app.redirect(link.attr('href'));
            }

            // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
            // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
            // Escape ~!@#$%^&*(){}[]`/=?+\|-_;:'",<.>
            function escapeStringForRegexp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
        }
    };

    Modules['sortable-table'] = function() {
        var that = this;
        that.start = function(element) {
            var defaultKey = element.data('default-key');
            element.on('click', '.js-sortable-header', sortTableBasedOnColumn);

            function sortTableBasedOnColumn(event) {
                var $target = $(event.target),
                    $col = $target.is('th') ? $target : $target.parents('th'),
                    key = $col.data('sort-key'),
                    type = $col.data('sort-type'),
                    direction = $col.is('.sorted-desc') ? 'asc' : 'desc',
                    $newRows = element.find('tbody tr').clone(),
                    colClass;

                element.find('th.sorted-column').removeClass('sorted-column sorted-asc sorted-desc');

                if (type == "number") {
                    $newRows = $newRows.sort(byNumber);
                } else {
                    $newRows = $newRows.sort(byName);
                }

                if (direction == 'desc') {
                    $newRows = $newRows.get().reverse();
                    colClass = "sorted-column sorted-desc";
                } else {
                    colClass = "sorted-column sorted-asc";
                }

                $col.addClass(colClass);
                element.find('tbody').html($newRows);

                function byNumber(aElement, bElement) {
                    var $a = $(aElement),
                        $b = $(bElement),
                        aNum = parseInt($a.data(key), 10),
                        bNum = parseInt($b.data(key), 10),
                        aText = $a.data(defaultKey),
                        bText = $b.data(defaultKey);

                    if (aNum > bNum) {
                        return 1;
                    } else if (aNum < bNum) {
                        return -1;
                    }

                    if (bText > aText) {
                        return 1;
                    } else if (bText < aText) {
                        return -1;
                    } else {
                        return 0;
                    }
                }

                function byName(aElement, bElement){
                    var $a = $(aElement),
                        $b = $(bElement),
                        a = $a.data(key).toLowerCase(),
                        b = $b.data(key).toLowerCase();

                    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                }

            }

        }
    };

    Modules['tab-switcher'] = function() {
        this.start = function(element) {
            var defaultTab = element.data('default-tab');
            showTabFromHash();

            if ("onhashchange" in window) {
                $(window).bind('hashchange', function(e) {
                    showTabFromHash();
                });
            }

            element.on('show.bs.tab', function(e) {
                var tabHref = $(e.target).attr('href'),
                    hash = tabHref.split('#')[1];

                if (hash !== defaultTab) {
                    window.location.hash = '!' + tabHref.split('#')[1];
                } else {
                    window.location.hash = '!';
                }
            });

            function showTabFromHash() {
                var hash = '#' + defaultTab;

                if (location.hash !== '' && location.hash !== '#!') {
                    hash = location.hash.replace(/!/,'');
                }

                var $tab = element.find('a[href="' + hash + '"]');

                if ($tab.length > 0) {
                    $tab.tab('show');
                }
            }
        }
    };

})(window.Modules);

$(function(){
    "use strict";

    var App = function () {
        this.find = function(container) {
            var modules,
                moduleSelector = '[data-module]',
                container = container || $('body');

          return container.find(moduleSelector);
        };

        this.start = function(container) {
            var modules = this.find(container);
            for (var i = 0, l = modules.length; i < l; i++) {
                var module,
                    element = $(modules[i]),
                    type = element.data('module');

                if (typeof Modules[type] === "function") {
                    module = new Modules[type]();
                    module.start(element);
                }
            }
        };

        this.redirect = function(path) {
            window.location.href = path;
        };
    };

    var app = new App();
    window.app = app;
    app.start();

    $('[data-toggle="tooltip"]').tooltip();
});
