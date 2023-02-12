class Widget { // Class Widget provides template-based element rendering
    constructor(template_name) {
        this.root_node = document.querySelector(`[data-template-name="${template_name}"]`).cloneNode(true);
        this.root_node.setAttribute('data-element-type', template_name);
    }

    getRootNode() {return this.root_node;}

    setTo(node, index = 0) {
        if (index === null) {
            node.replaceChildren(this.getRootNode());
        }
        else if (index >= node.children.length) {
            node.appendChild(this.getRootNode())
        } else {
            node.insertBefore(this.getRootNode(), node.children[index])
        }
    }

    remove() {
        this.getRootNode().remove();
    }

    setAttribute(attr_name, value) {
        this.getRootNode().setAttribute(attr_name, value);
    }

    getPropertyNode(property_name) {
        return this.getRootNode().querySelector(`[data-property-name="${property_name}"]`);
    }

    setProperty(property_name, content) {
        this.getPropertyNode(property_name).innerHTML = content;
    }

    render(props) {  }
}

class ListWidget extends Widget {
    constructor(template_name) {
        super(template_name);

        this.cards = {};
        this.list_node = this.getRootNode();
    }

    // Own methods
    getCard(id) {
        return this.cards[id];
    }
    insertCard(id, index, card) {
        if (! (id in this.cards)) {
            this.cards[id] = card;
            card.setTo(this.list_node, index);
            return true;
        }
        return false;
    }

    removeCard(id) {
        if (id in this.cards) {
            this.cards[id].remove();
            delete this.cards[id];
            return true;
        }
        return false;
    }

    removeAllCards() { // use if recreate elements every render() call of ListWidget
        for (let id in this.cards) {
            this.cards[id].remove();
            delete this.cards[id];
        }
    }
}

class CardListWidget extends ListWidget {
    constructor() {
        super('card-layout');
    }
}

class FieldErrorWidget extends Widget {
    constructor() {
        super('field-error');
    }

    render(props) {
        let errors_html = '';
        props.errors.forEach(error => {
            errors_html +=  `<li>${error}</li>`;
        });

        this.setProperty('errors-ul', errors_html);
    }
}

class CardLayoutPlaceholderWidget extends Widget {
    constructor() {
        super('card-layout-placeholder');
    }

    render(props) {
        this.setProperty('placeholder', props['placeholder']);
    }
}

class TesterImgPlaceholderWidget extends Widget {
    constructor() {
        super('tester-img-placeholder');
    }

    render(props) {
        this.setAttribute('src', props['photo']);
    }
}

class APIMiddleware { // APIMiddleware embeds variable functionality into APIProvider
    processRequest(api_provider, options) {
        if (! options.headers) {
            options.headers = {}
        }
    } // change options object properties
}

class JSONContentMiddleware extends APIMiddleware {
    processRequest(api_provider, options) {
        super.processRequest(api_provider, options);

        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(api_provider.body);
        }
    }
}

class MultiPartContentMiddleware extends APIMiddleware {
    processRequest(api_provider, options) {
        super.processRequest(api_provider, options);

        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
            options.body = this.formDataFromObject(api_provider.body);
        }
    }

    formDataFromObject(data) {
        let form_data = new FormData();
        for (let key in data) {
            form_data.set(key, data[key]);
        }
        return form_data;
    }
}

class CSRFTokenMiddleware extends APIMiddleware {
    processRequest(api_provider, options) {
        super.processRequest(api_provider, options);

        options.headers['X-CSRFToken'] = this.getCookie('csrftoken');
    }
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            let cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

class APIProvider { // APIProvider class provides REST-based requests
    constructor(url_path, data = {}) {
        this.url_path = url_path;
        this.params = data['params'] ? data['params'] : {};
        this.body = data['body'] ? data['body'] : {};
        this.middlewares = data['middlewares'] ? data['middlewares'] : [];
    }

    generateURL(method, id = null) {
        let url = new URL(this.url_path, document.location.origin);
        let full_url_path = id != null ? new URL(id, url) + '/' : url;
        if (method === 'GET') {
            full_url_path.settings = new URLSearchParams(this.params).toString();
        }
        return full_url_path;
    }

    send(options, id = null) {
        this.middlewares.forEach(middleware => {
            middleware.processRequest(this, options);
        });

        return fetch(this.generateURL(options.method, id), options);
    }

    get(id = null) {
        return this.send({
            method: 'GET'
        }, id);
    }

    post() {
        return this.send({
            method: 'POST',
        }, null);
    }

    put(id) {
        return this.send({
            method: 'PUT',
        }, id);
    }

    patch(id) {
        return this.send({
            method: 'PATCH',
        }, id);
    }

    delete(id) {
        return this.send({
            method: 'DELETE',
        }, id);
    }
}

class TasksAPIProvider extends APIProvider {
    constructor(body = null, encode = 'json') {
        super('/app/api/tasks/', {
            body: body,
            middlewares:
                encode === 'multipart' ?
                    [new MultiPartContentMiddleware(), new CSRFTokenMiddleware()] :
                encode === 'json' ?
                    [new JSONContentMiddleware(), new CSRFTokenMiddleware()] :
                    [new CSRFTokenMiddleware()],
        });
    }
}

class TestersAPIProvider extends APIProvider {
    constructor(body = null, encode = 'json') {
        super('/app/api/testers/', {
            body: body,
            middlewares:
                encode === 'multipart' ?
                    [new MultiPartContentMiddleware(), new CSRFTokenMiddleware()] :
                encode === 'json' ?
                    [new JSONContentMiddleware(), new CSRFTokenMiddleware()] :
                    [new CSRFTokenMiddleware()],
        });
    }
}

class FormSerializer {
    /*
        FormSerializer validates form during construction.

        validators = {
            'key': function (val) {}
        }

        Function returns null if valid or array with error messages if invalid.

        If value of 'key' is not function, only check is 'key' in this.data.

        input_transformers = {
            'key': function(val) { return new_val; }
        }

        Transformers make transform from form_data format to app_model_data format.

        reset_controller = function(form_node, data) {}
    */
    constructor(
        form_node,
        validators,
        input_transformers = {},
        output_transformers = {},
        default_data = null,
        reset_controller = null,
    ) {
        this.form_node = form_node;
        this.validators = validators;
        this.input_transformers = input_transformers;
        this.output_transformers = output_transformers;
        this.reset_controller = reset_controller;

        this.errors_obj = {};
        this.default_error_message = 'Value required!';
        this.validate_vc = null;

        this.resetForm(default_data);

        let formEntries = new FormData(form_node).entries();
        let data_arr = Array.from(formEntries, ([x,y]) => ({[x]:y}));
        this.data = data_arr.length === 0 ? {} : Object.assign(...data_arr);

        this.is_valid = this.validation();

        this.transformed_data = this.transform(this.data, this.input_transformers);
    }

    resetForm(default_data = null) {
        if (default_data === null) return;

        this.form_node.reset();
        let default_data_transformed = this.transform(default_data, this.output_transformers);
        if (this.reset_controller === null) {
            for (let name in default_data_transformed) {
                if (this.form_node.elements[name]) {
                    this.form_node.elements[name].value = default_data_transformed[name];
                }
            }
        }
        else {
            this.reset_controller(this.form_node, default_data_transformed);
        }
    }

    validation() {
        let is_valid = true;
        this.errors_obj = {};
        for (let key in this.validators) {
            if (this.data[key]) {
                if (typeof this.validators[key] === 'function') {
                    let cur_errors = this.validators[key](this.data[key]);
                    if (cur_errors !== null) {
                        this.errors_obj[key] = cur_errors;
                        is_valid = false;
                    }
                }
            }
            else {
                this.errors_obj[key] = [this.default_error_message];
                is_valid = false;
            }
        }

        return is_valid;
    }

    transform(data, transformers) {
        let transformed_data = {};
        for (let key in data) {
            transformed_data[key] = data[key];
        }

        for (let key in transformers) {
            if (data[key]) {
                let transform_result = transformers[key](data[key]);
                if (transform_result === undefined) {
                    delete transformed_data[key];
                }
                else {
                    transformed_data[key] = transform_result;
                }
            }
        }
        return transformed_data;
    }

    setDefaultErrorMessage(msg) {
        this.default_error_message = msg;
    }

    setValidateVisualController(validate_vc) {
        this.validate_vc = validate_vc;
    }

    showValidationErrors() {
        for (let key in this.validators) {
            if (this.validate_vc) {
                this.validate_vc.clearErrors(this.form_node, key);
            }
        }

        for (let key in this.errors_obj) {
            if (this.validate_vc) {
                this.validate_vc.showErrors(this.form_node, key, this.errors_obj[key]);
            }
        }
    }
}

class TaskSerializer extends FormSerializer {
    constructor(form_node, default_data = null) {
        super(
            form_node,
            {
                'title': function(value) {
                    let errors = [];
                    value = String(value);
                    if (([...value].length) > 32) {
                        errors.push('Title length must be less than 32.');
                    }

                    return errors.length > 0 ? errors : null;
                },
                'date_time': true
            },
            {
                'date_time': function(value) {
                    return (new Date(value)).toISOString();
                }
            },
            {
                'date_time': function(value) {
                    return (new Date(value)).toLocaleString("sv-SE", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }).replace(" ", "T");
                }
            },
            default_data,
            null
        );
    }
}

class TesterSerializer extends FormSerializer {
    constructor(form_node, default_data = null) {
        super(
            form_node,
            {
                'firstname': function(value) {
                    let errors = [];
                    value = String(value);
                    if (([...value].length) > 32) {
                        errors.push('Firstname length must be less than 32.');
                    }

                    return errors.length > 0 ? errors : null;
                },
                'lastname': function(value) {
                    let errors = [];
                    value = String(value);
                    if (([...value].length) > 32) {
                        errors.push('Lastname length must be less than 32.');
                    }

                    return errors.length > 0 ? errors : null;
                },
                'description': function(value) {
                    let errors = [];
                    value = String(value);
                    if (([...value].length) > 32) {
                        errors.push('Description length must be less than 32.');
                    }

                    return errors.length > 0 ? errors : null;
                },
            },
            {
                'photo': function(value) {
                    if (! value.name) return undefined;
                    return value;
                }
            },
            {

            },
            default_data,
            function(form_node, data) {
                let tester_img_placeholder = new TesterImgPlaceholderWidget();
                if (data['photo']) {
                    tester_img_placeholder.render({ photo: data['photo'] });
                }
                let id = form_node.querySelector('input[name="photo"]').getAttribute('data-photo-view-id');
                tester_img_placeholder.setTo(document.getElementById(id), null);

                for (let name in data) {
                    if (name === 'photo') continue;
                    if (this.form_node.elements[name]) {
                        this.form_node.elements[name].value = data[name];
                    }
                }
            }
        );
    }
}

class AddTesterToTaskSerializer extends FormSerializer {
    constructor(form_node, default_data = null) {
        super(
            form_node,
            {
                'tester': true,
            },
            {

            },
            {

            },
            default_data,
            function (form_node, data) {
                if (data['tester']) {
                    form_node.elements['tester'].value = data['tester'];
                }
            }
        );
    }
}

class ValidateVisualController {
    clearErrors(form_node, key) {  }
    showErrors(form_node, key, errors) {  }
}

class SimpleFormValidateVisualController extends ValidateVisualController {
    clearErrors(form_node, key) {
        let error_node = form_node.querySelector(`[data-error-name="${key}"]`);
        if (error_node) {
            error_node.innerHTML = '';
        }
    }
    showErrors(form_node, key, errors) {
        let error_node = form_node.querySelector(`[data-error-name="${key}"]`);
        if (error_node) {
            let error_widget = new FieldErrorWidget();
            error_widget.render({errors: errors});
            error_widget.setTo(error_node);
        }
    }
}

class EventNotifier {
    constructor() {
        this.events_mapping = {};
    }

    addEventListener(event_name, callback) {
        if (! this.events_mapping[event_name]) {
            this.events_mapping[event_name] = [];
        }

        this.events_mapping[event_name].push(callback);
    }

    sendEvent(event_name, ...args) {
        if (event_name in this.events_mapping) {
            for (let callback of this.events_mapping[event_name]) {
                callback(...args);
            }
        }
    }
}

class AppDataModel extends EventNotifier {
    constructor() {
        super();

        this.tasks = [];
        this.testers = [];
    }

    // Tasks
    setTasks(tasks) {
        this.tasks = tasks;
        this.sendEvent('setTasks', tasks);
    }

    getTaskIndex(id) {
        return this.tasks.findIndex(item => String(item.id) === String(id));
    }

    getTask(id) {
        return this.tasks[this.getTaskIndex(id)];
    }

    addTask(task) {
        this.tasks.push(task);
        this.sendEvent('addTask', task);
    }

    editTask(task) {
        this.tasks[this.getTaskIndex(task.id)] = task;
        this.sendEvent('editTask', task);
    }

    removeTask(id) {
        this.tasks.splice(this.getTaskIndex(id), 1);
        this.sendEvent('removeTask', id);
    }

    // task testers
    setTaskTesters(task_id, testers_ids) {
        this.getTask(task_id).testers = testers_ids;
        this.sendEvent('setTaskTesters', task_id, testers_ids);
    }

    setTestersTasks(tester_id, tasks_ids) {
        this.getTester(tester_id).task_set = tasks_ids;
        this.sendEvent('setTestersTasks', tester_id, tasks_ids);
    }

    addTesterToTask(task_id, tester_id) {
        let task = this.getTask(task_id);
        task.testers = patchArray(task.testers, [ tester_id ]);
        this.sendEvent('addTesterToTask', task_id, tester_id);
    }

    removeTesterFromTask(task_id, tester_id) {
        let task = this.getTask(task_id);
        task.testers = task.testers.filter(_tester_id => String(_tester_id) !== String(tester_id));
        this.sendEvent('removeTesterFromTask', task_id, tester_id);
    }


    // Testers
    setTesters(testers) {
        this.testers = testers;
        this.sendEvent('setTesters', testers);
    }

    getTesterIndex(id) {
        return this.testers.findIndex(item => String(item.id) === String(id));
    }

    getTester(id) {
        return this.testers[this.getTesterIndex(id)];
    }

    addTester(tester) {
        this.testers.push(tester);
        this.sendEvent('addTester', tester);
    }

    editTester(tester) {
        this.testers[this.getTesterIndex(tester.id)] = tester;
        this.sendEvent('editTester', tester);
    }

    removeTester(id) {
        this.testers.splice(this.getTesterIndex(id), 1);
        this.sendEvent('removeTester', id);
    }
}

class AppPageController {
    constructor(app_data_model, ui_elements) {
        this.app_data_model = app_data_model;
        this.ui_elements = ui_elements;
    }

    async initializeData() {
        let tasks_response = await new TasksAPIProvider().get();
        let tasks = await tasks_response.json();
        this.app_data_model.setTasks(tasks);

        let testers_response = await new TestersAPIProvider().get();
        let testers = await testers_response.json();
        this.app_data_model.setTesters(testers);

        tasks.forEach(task => {
            this.app_data_model.setTaskTesters(task.id, task['testers']);
        });

        testers.forEach(tester => {
            this.app_data_model.setTestersTasks(tester.id, tester['task_set']);
        });
    }

    setupDOMEventActions() {
        this.setupShowSidebar();
        this.setupShowPhotoFromInput();
        this.setupOpenCreditsDialog();
    }

    setupShowSidebar() {
        document.querySelectorAll('[data-action="show-sidebar"]').forEach(item => {
            item.addEventListener('click', event => {
                let sidebar = document.getElementById('sidebar');
                let sidebarOverlay = document.getElementById('sidebarOverlay');
                if (sidebar.classList.contains('hidden')) {
                    sidebar.classList.remove('hidden');
                }
                else {
                    sidebar.classList.add('hidden');
                }

                if (sidebarOverlay.classList.contains('hidden')) {
                    sidebarOverlay.classList.remove('d-none');
                    setTimeout(() => {
                        sidebarOverlay.classList.remove('hidden');
                    }, 1);
                }
                else {
                    setTimeout(() => {
                        sidebarOverlay.classList.add('d-none');
                    }, 300);
                    sidebarOverlay.classList.add('hidden');
                }
            });
        });
    }

    setupShowPhotoFromInput() {
        document.querySelectorAll('[data-action="choose-photo"]').forEach(item => {
            item.addEventListener('change', event => {
                let viewer_id = event.target.getAttribute('data-photo-view-id');
                setImageFromFile(event.target, viewer_id);
            });
        });
    }

    setupOpenCreditsDialog() {
        on(
            'click',
            document.querySelector('body'),
            `[data-action="open-credits-dialog"]`,
            event => {
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                this.openDialog(dialog_id);
            }
        );
    }

    openDialog(dialog_id) {
        document.getElementById(dialog_id)
            .classList.remove('d-none');
        setTimeout(() => {
            document.getElementById(dialog_id)
                .classList.remove('hidden');
        }, 1);
    }

    closeDialog(dialog_id) {
        if (dialog_id) {
            document.getElementById(dialog_id)
                .classList.add('hidden');
            setTimeout(() => {
                document.getElementById(dialog_id)
                    .classList.add('d-none');
            }, 300);
        }
    }
}

// helpers
function on(event_name, static_parent, ...args) {
    if (typeof static_parent === "string") {
        static_parent = document.querySelector(static_parent);
    }
    if (typeof args[0] === "string") {
        static_parent.addEventListener(event_name, (event) => {
            if (args[2]) { // strict mode
                if (event.target.closest(args[0]) === event.target) {
                    args[1](event);
                }
            }
            else if (event.target.closest(args[0])) {
                event.closestTarget = event.target.closest(args[0]);
                args[1](event);
            }
        });
    }
    else {
        static_parent.addEventListener(event_name, ...args);
    }
}

function patchObject(prev, changes) {
    let obj = {};
    for (let key in prev) {
        obj[key] = prev[key];
    }

    for (let key in changes) {
        obj[key] = changes[key];
    }
    return obj;
}

function patchArray(prev, changes) {
    let arr = [...prev];
    changes.forEach(item => {
        if (! arr.find(el => el === item)) {
            arr.unshift(item);
        }
    });
    return arr;
}

function setImageFromFile(input, id) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();

        reader.onload = function(e) {
            let tester_img_placeholder = new TesterImgPlaceholderWidget();
            tester_img_placeholder.render({ photo: e.target.result });
            tester_img_placeholder.setTo(document.getElementById(id), null);
        };

        reader.readAsDataURL(input.files[0]);
    }
}