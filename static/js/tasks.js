class TaskTestersListWidget extends ListWidget {
    constructor() {
        super('task-testers-list');
    }
}

class TaskTesterCircleWidget extends Widget {
    constructor() {
        super('task-tester-circle');
    }

    render(props) { // props - tester object
        this.setAttribute('data-id', props['id']);

        let tester_img_placeholder = new TesterImgPlaceholderWidget();
        if (props['photo']) {
            tester_img_placeholder.render({ photo: props['photo'] });
        }
        tester_img_placeholder.setTo(this.getPropertyNode('tester-photo'), null);
    }
}

class ChooseTestersPlaceholderWidget extends Widget {
    constructor() {
        super('choose-testers-placeholder');
    }
}

class ChooseTesterListWidget extends ListWidget {
    constructor() {
        super('choose-tester-list');
    }

    render(props) { // props == testers list (rebuild full list)
        this.removeAllCards();

        if (! props) return;

        if (props.length > 0) {
            props.forEach(tester => {
                let card = new ChooseTesterListElemWidget();
                card.render(tester);
                this.insertCard(tester['id'], 0, card);
            });
        }
        else {
            let card = new ChooseTestersPlaceholderWidget();
            this.insertCard(0, 0, card);
        }
    }
}

class ChooseTesterListElemWidget extends Widget {
    constructor() {
        super('choose-tester-list-elem');
    }

    render(props) {
        this.setProperty('tester-name', `${props['firstname']} ${props['lastname']}`)
        this.getPropertyNode('tester-id-input').value = props['id'];

        let tester_img_placeholder = new TesterImgPlaceholderWidget();
        if (props['photo']) {
            tester_img_placeholder.render({ photo: props['photo'] });
        }
        tester_img_placeholder.setTo(this.getPropertyNode('tester-photo'), null);
    }
}

class TaskCardWidget extends Widget {
    constructor() {
        super('task-card');

        this.task_testers_list = new TaskTestersListWidget();
        this.task_testers_list.setTo(this.getPropertyNode('task-testers-list-wrapper'));
    }

    render(props) {
        this.setAttribute('data-id', props['id']);
        this.setAttribute('data-onload-anim', 'true');
        this.setProperty('task-title', props['title']);

        if (! props['description'])
            this.getPropertyNode('task-description-container').classList.add('d-none');
        else
            this.getPropertyNode('task-description-container').classList.remove('d-none');
        this.setProperty('task-description', props['description']);

        if (! props['address'])
            this.getPropertyNode('task-address-container').classList.add('d-none');
        else
            this.getPropertyNode('task-address-container').classList.remove('d-none');
        this.setProperty('task-address', props['address']);

        if (! props['date_time'])
            this.getPropertyNode('task-datetime-container').classList.add('d-none');
        else
            this.getPropertyNode('task-datetime-container').classList.remove('d-none');
        this.setProperty('task-datetime', (new Date(props['date_time'])).toLocaleString() );
    }
}

class TasksPageModelView { // change view on model changed (listening model events for modify view)
    constructor(app_data_model, ui_elements) {
        this.app_data_model = app_data_model;
        this.ui_elements = ui_elements;

        this.app_data_model.addEventListener('setTasks', this.onSetTasks.bind(this));
        this.app_data_model.addEventListener('addTask', this.onAddTask.bind(this));
        this.app_data_model.addEventListener('editTask', this.onEditTask.bind(this));
        this.app_data_model.addEventListener('removeTask', this.onRemoveTask.bind(this));
        this.app_data_model.addEventListener('setTaskTesters', this.onSetTaskTesters.bind(this));
        this.app_data_model.addEventListener('addTesterToTask', this.onAddTesterToTask.bind(this));
        this.app_data_model.addEventListener('removeTesterFromTask', this.onRemoveTesterFromTask.bind(this));
    }

    onSetTasks(tasks) {
        if (tasks.length === 0) {
            this.showLayoutPlaceholder();
        }
        else {
            this.ui_elements.card_list_widget.removeAllCards();

            tasks.forEach(task => {
                let card = new TaskCardWidget();
                card.render(task);
                this.ui_elements.card_list_widget.insertCard(task.id, 0, card);

                if (`#task_${task['id']}` === window.location.hash) {
                    card.getRootNode().classList.add('target');
                }
            });
        }
        setTimeout(() => {runOnLoadAnim();}, 100);
    }

    onAddTask(task) {
        if (this.ui_elements.card_list_widget.getCard(0)) {
            this.ui_elements.card_list_widget.removeAllCards();
        }

        let card = new TaskCardWidget();
        card.render(task);
        this.ui_elements.card_list_widget.insertCard(task.id, 0, card);

        setTimeout(() => {runOnLoadAnim();}, 100);
    }

    onEditTask(task) {
        let card = this.ui_elements.card_list_widget.getCard(task.id);
        card.render(task);
    }

    onRemoveTask(id) {
        this.ui_elements.card_list_widget.removeCard(id);

        if (Object.keys(this.ui_elements.card_list_widget.cards).length === 0) {
            this.showLayoutPlaceholder();
        }
    }

    onSetTaskTesters(task_id, testers_ids) {
        if (! task_id || ! testers_ids) return;
        let card = this.ui_elements.card_list_widget.getCard(task_id);
        testers_ids.forEach(tester_id => {
            let tester = this.app_data_model.getTester(tester_id);
            let tester_card = new TaskTesterCircleWidget();
            tester_card.render(tester);
            card.task_testers_list.insertCard(tester_id, 0, tester_card);
        });
    }

    onAddTesterToTask(task_id, tester_id) {
        if (! task_id || ! tester_id) return;
        let card = this.ui_elements.card_list_widget.getCard(task_id);
        let tester = this.app_data_model.getTester(tester_id);
        let tester_card = new TaskTesterCircleWidget();
        tester_card.render(tester);
        card.task_testers_list.insertCard(tester_id, 0, tester_card);
    }

    onRemoveTesterFromTask(task_id, tester_id) {
        if (! task_id || ! tester_id) return;
        let card = this.ui_elements.card_list_widget.getCard(task_id);
        card.task_testers_list.removeCard(tester_id);
    }


    // helpers
    showLayoutPlaceholder() {
        let card = new CardLayoutPlaceholderWidget();
        card.render({'placeholder': 'На данный момент нет активных задач'});
        this.ui_elements.card_list_widget.insertCard(0, 0, card);
    }
}

class TasksPageController extends AppPageController {
    constructor(app_data_model, ui_elements) {
        super(app_data_model, ui_elements);

        this.initializeData().then(() => {
            this.setupDOMEventActions();
        });
    }

    async initializeData() {
        await super.initializeData();
    }

    setupDOMEventActions() {
        super.setupDOMEventActions();

        this.setupAddTaskAction();
        this.setupEditTaskAction();
        this.setupRemoveTaskAction();
        this.setupAddTesterToTask();
        this.setupRemoveTesterFromTask();

        this.setupDialogDefaultActions();
        this.setupOpenAddTaskDialogAction();
        this.setupOpenEditTaskDialog();
        this.setupOpenAddTesterToTaskDialog();
    }

    setupAddTaskAction() {
        on(
            'submit',
            document.getElementById('contentSection'),
            `[data-action="add-task"]`,
            event => {
                let task_form = event.closestTarget;
                let task_form_serializer = new TaskSerializer(task_form);

                task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());

                if (task_form_serializer.is_valid) {
                    let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                    this.closeDialog(dialog_id);

                    (async () => {
                        let response = await new TasksAPIProvider(task_form_serializer.transformed_data, 'json').post();
                        if (response.ok) {
                            let task = await response.json();
                            this.app_data_model.addTask(task);
                        }
                    })();
                }
                else {
                    task_form_serializer.showValidationErrors();
                }

                event.preventDefault();
                return false;
            }
        );
    }

    setupEditTaskAction() {
        on(
            'submit',
            document.getElementById('contentSection'),
            `[data-action="edit-task"]`,
            event => {
                let task_form = event.closestTarget;
                let task_form_serializer = new TaskSerializer(task_form);

                task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());

                if (task_form_serializer.is_valid) {
                    let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                    this.closeDialog(dialog_id);

                    (async () => {
                        let id = task_form.getAttribute('data-task-id');

                        let response = await new TasksAPIProvider(task_form_serializer.transformed_data, 'json').patch(id);
                        if (response.ok) {
                            let task = await response.json();
                            this.app_data_model.editTask(task);
                        }
                    })();
                }
                else {
                    task_form_serializer.showValidationErrors();
                }

                event.preventDefault();
                return false;
            }
        );
    }

    setupRemoveTaskAction() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="remove-task"]`,
            event => {
                let task_card = event.closestTarget.closest('[data-element-type="task-card"]');
                let id = task_card.getAttribute('data-id');

                (async () => {
                    let response = await new TasksAPIProvider().delete(id);
                    if (response.ok) {
                        this.app_data_model.removeTask(id);
                    }
                })();
            }
        );
    }

    setupAddTesterToTask() {
        on(
            'submit',
            document.getElementById('contentSection'),
            `[data-action="add-tester-to-task"]`,
            event => {
                let tester_to_task_form = event.closestTarget;
                let tester_to_task_form_serializer = new AddTesterToTaskSerializer(tester_to_task_form);

                tester_to_task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());

                if (tester_to_task_form_serializer.is_valid) {
                    let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                    this.closeDialog(dialog_id);

                    (async () => {
                        let task_id = tester_to_task_form.getAttribute('data-task-id');
                        let tester_id = tester_to_task_form_serializer.transformed_data['tester'];
                        let patched_testers = patchArray(this.app_data_model.getTask(task_id)['testers'], [tester_id]);

                        let response = await new TasksAPIProvider({ 'testers': patched_testers }, 'json').patch(task_id);
                        if (response.ok) {
                            this.app_data_model.addTesterToTask(task_id, tester_id);
                        }
                    })();
                }
                else {
                    tester_to_task_form_serializer.showValidationErrors();
                }

                event.preventDefault();
                return false;
            }
        );
    }

    setupRemoveTesterFromTask() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="remove-tester-from-task"]`,
            event => {
                let task_card = event.closestTarget.closest('[data-element-type="task-card"]');
                let task_id = task_card.getAttribute('data-id');
                let task = this.app_data_model.getTask(task_id);

                let tester_card = event.closestTarget.closest('[data-element-type="task-tester-circle"]');
                let tester_id = tester_card.getAttribute('data-id');

                (async () => {
                    let patched_testers = task.testers.filter(_tester_id => String(_tester_id) !== String(tester_id));

                    let response = await new TasksAPIProvider({ 'testers': patched_testers }, 'json').patch(task_id);
                    if (response.ok) {
                        this.app_data_model.removeTesterFromTask(task_id, tester_id);
                    }
                })();
            }
        );
    }


    setupDialogDefaultActions() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="dialog-close"]`,
            event => {
                let dialog_id = event.target.getAttribute('data-dialog-id');
                this.closeDialog(dialog_id);
            },
            true
        );
    }

    setupOpenAddTaskDialogAction() {
        on(
            'click',
            document.querySelector('body'),
            `[data-action="open-add-task-dialog"]`,
            event => {
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                let form_node = document.getElementById(dialog_id).querySelector('form');
                form_node.setAttribute('data-action', 'add-task');
                form_node.setAttribute('data-task-id', '');
                let form_button = form_node.querySelector('button[type="submit"]');
                form_button.innerHTML = 'Создать задачу';
                let title_node = document.getElementById(dialog_id).querySelector('.dialog-title');
                title_node.innerHTML = 'Создание задачи';

                let task_form_serializer = new TaskSerializer(form_node, {}); // clear form
                task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());
                task_form_serializer.showValidationErrors();
                this.openDialog(dialog_id);
            }
        );
    }

    setupOpenEditTaskDialog() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="open-edit-task-dialog"]`,
            event => {
                let task_card = event.closestTarget.closest('[data-element-type="task-card"]');
                let id = task_card.getAttribute('data-id');
                let task_data = this.app_data_model.getTask(id);

                // setup visual and properties
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                let form_node = document.getElementById(dialog_id).querySelector('form');
                form_node.setAttribute('data-action', 'edit-task');
                form_node.setAttribute('data-task-id', id);
                let form_button = form_node.querySelector('button[type="submit"]');
                form_button.innerHTML = 'Изменить задачу';
                let title_node = document.getElementById(dialog_id).querySelector('.dialog-title');
                title_node.innerHTML = 'Изменение задачи';

                let task_form_serializer = new TaskSerializer(form_node, task_data); // clear form
                task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());
                task_form_serializer.showValidationErrors();
                this.openDialog(dialog_id);
            }
        );
    }

    setupOpenAddTesterToTaskDialog() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="open-add-tester-to-task-dialog"]`,
            event => {
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                let form_node = document.getElementById(dialog_id).querySelector('form');
                let task_card = event.closestTarget.closest('[data-element-type="task-card"]');
                let id = task_card.getAttribute('data-id');
                form_node.setAttribute('data-task-id', id);

                let task_data = this.app_data_model.getTask(id);
                let used_testers_ids = task_data['testers'];
                let testers = this.app_data_model.testers;
                let avail_testers = testers.filter(tester => ! used_testers_ids.find(item => String(item) === String(tester['id'])));
                this.ui_elements.choose_tester_list.render(avail_testers);

                let task_form_serializer = new AddTesterToTaskSerializer(form_node, {}); // clear form
                task_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());
                task_form_serializer.showValidationErrors();
                this.openDialog(dialog_id);
            }
        );
    }
}


let ui_elements;
let app_data_model;
let tasks_page_model_view;
let tasks_page_controller;

function documentReady() {
    ui_elements = {
        card_list_widget: new CardListWidget(),
        choose_tester_list: new ChooseTesterListWidget()
    };

    ui_elements.card_list_widget.render();
    ui_elements.card_list_widget.setTo(document.getElementById('contentSection'));

    ui_elements.choose_tester_list.render();
    ui_elements.choose_tester_list.setTo(document.querySelector('#addTesterToTaskDialog form'));

    app_data_model = new AppDataModel();

    tasks_page_model_view = new TasksPageModelView(app_data_model, ui_elements);
    tasks_page_controller = new TasksPageController(app_data_model, ui_elements);
}

document.addEventListener("DOMContentLoaded", documentReady);
