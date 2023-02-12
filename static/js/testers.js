class TesterCardWidget extends Widget {
    constructor() {
        super('tester-card');
    }

    render(props) {
        this.setAttribute('data-id', props['id']);
        this.setAttribute('data-onload-anim', 'true');
        this.setProperty('tester-name', `${props['firstname']} ${props['lastname']}`);
        this.setProperty('tester-description', props['description']);

        let tester_img_placeholder = new TesterImgPlaceholderWidget();
        if (props['photo']) {
            tester_img_placeholder.render({ photo: props['photo'] });
        }
        tester_img_placeholder.setTo(this.getPropertyNode('tester-photo'), null);
    }
}

class TestersPageModelView { // change view on model changed (listening model events for modify view)
    constructor(app_data_model, ui_elements) {
        this.app_data_model = app_data_model;
        this.ui_elements = ui_elements;

        this.app_data_model.addEventListener('setTesters', this.onSetTesters.bind(this));
        this.app_data_model.addEventListener('addTester', this.onAddTester.bind(this));
        this.app_data_model.addEventListener('editTester', this.onEditTester.bind(this));
        this.app_data_model.addEventListener('removeTester', this.onRemoveTester.bind(this));
        this.app_data_model.addEventListener('setTestersTasks', this.onSetTestersTasks.bind(this));
    }

    onSetTesters(testers) {
        if (testers.length === 0) {
            this.showLayoutPlaceholder();
        }
        else {
            this.ui_elements.card_list_widget.removeAllCards();

            testers.forEach(tester => {
                let card = new TesterCardWidget();
                card.render(tester);
                this.ui_elements.card_list_widget.insertCard(tester.id, 0, card);
            });
        }

        setTimeout(() => {runOnLoadAnim();}, 100);
    }

    onAddTester(tester) {
        if (this.ui_elements.card_list_widget.getCard(0)) {
            this.ui_elements.card_list_widget.removeAllCards();
        }

        let card = new TesterCardWidget();
        card.render(tester);
        this.ui_elements.card_list_widget.insertCard(tester.id, 0, card);

        setTimeout(() => {runOnLoadAnim();}, 100);
    }

    onEditTester(tester) {
        let card = this.ui_elements.card_list_widget.getCard(tester.id);
        card.render(tester);
    }

    onRemoveTester(id) {
        this.ui_elements.card_list_widget.removeCard(id);

        if (Object.keys(this.ui_elements.card_list_widget.cards).length === 0) {
            this.showLayoutPlaceholder();
        }
    }

    onSetTestersTasks(tester_id, tasks_ids) {
        if (! tester_id || ! tasks_ids) return;
        let card = this.ui_elements.card_list_widget.getCard(tester_id);

        let nearest_time = null;
        let nearest_task = null;
        tasks_ids.forEach(task_id => {
            let task = this.app_data_model.getTask(task_id);
            if (new Date(task['date_time']) > new Date()) {
                if (! nearest_task) {
                    nearest_task = task;
                    nearest_time = task['date_time'];
                    return;
                }
                if (new Date(nearest_time) > new Date(task['date_time'])) {
                    nearest_task = task;
                    nearest_time = task['date_time'];
                }
            }
        });
        if (nearest_task) {
            card.setProperty('tester-nearest-task', nearest_task['title']);

            let nearest_task_node = card.getPropertyNode('tester-nearest-task');
            let nt_href = nearest_task_node.getAttribute('href');
            nearest_task_node.setAttribute('href', `${nt_href}#task_${nearest_task['id']}`);
        }
    }

    // helpers
    showLayoutPlaceholder() {
        let card = new CardLayoutPlaceholderWidget();
        card.render({'placeholder': 'На данный момент нет добавленных тестировщиков'});
        this.ui_elements.card_list_widget.insertCard(0, 0, card);
    }
}

class TestersPageController extends AppPageController {
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

        this.setupAddTesterAction();
        this.setupEditTesterAction();
        this.setupRemoveTesterAction();

        this.setupDialogDefaultActions();
        this.setupOpenAddTesterDialogAction();
        this.setupOpenEditTesterDialog();
    }

    setupAddTesterAction() {
        on(
            'submit',
            document.getElementById('contentSection'),
            `[data-action="add-tester"]`,
            event => {
                let tester_form = event.closestTarget;
                let tester_form_serializer = new TesterSerializer(tester_form);

                tester_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());

                if (tester_form_serializer.is_valid) {
                    let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                    this.closeDialog(dialog_id);

                    (async () => {
                        let response = await new TestersAPIProvider(tester_form_serializer.transformed_data, 'multipart').post();
                        if (response.ok) {
                            let tester = await response.json();
                            this.app_data_model.addTester(tester);
                        }
                    })();
                }
                else {
                    tester_form_serializer.showValidationErrors();
                }

                event.preventDefault();
                return false;
            }
        );
    }

    setupEditTesterAction() {
        on(
            'submit',
            document.getElementById('contentSection'),
            `[data-action="edit-tester"]`,
            event => {
                let tester_form = event.closestTarget;
                let tester_form_serializer = new TesterSerializer(tester_form);

                tester_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());

                if (tester_form_serializer.is_valid) {
                    let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                    this.closeDialog(dialog_id);

                    (async () => {
                        let id = tester_form.getAttribute('data-tester-id');

                        let response = await new TestersAPIProvider(tester_form_serializer.transformed_data, 'multipart').patch(id);
                        if (response.ok) {
                            let tester = await response.json();
                            this.app_data_model.editTester(tester);
                        }
                    })();
                }
                else {
                    tester_form_serializer.showValidationErrors();
                }

                event.preventDefault();
                return false;
            }
        );
    }

    setupRemoveTesterAction() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="remove-tester"]`,
            event => {
                let tester_card = event.closestTarget.closest('[data-element-type="tester-card"]');
                let id = tester_card.getAttribute('data-id');

                (async () => {
                    let response = await new TestersAPIProvider().delete(id);
                    if (response.ok) {
                        this.app_data_model.removeTester(id);
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

    setupOpenAddTesterDialogAction() {
        on(
            'click',
            document.querySelector('body'),
            `[data-action="open-add-tester-dialog"]`,
            event => {
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                let form_node = document.getElementById(dialog_id).querySelector('form');
                form_node.setAttribute('data-action', 'add-tester');
                form_node.setAttribute('data-tester-id', '');
                let form_button = form_node.querySelector('button[type="submit"]');
                form_button.innerHTML = 'Создать тестировщика';
                let title_node = document.getElementById(dialog_id).querySelector('.dialog-title');
                title_node.innerHTML = 'Создание тестировщика';

                let tester_form_serializer = new TesterSerializer(form_node, {}); // clear form
                tester_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());
                tester_form_serializer.showValidationErrors();
                this.openDialog(dialog_id);
            }
        );
    }

    setupOpenEditTesterDialog() {
        on(
            'click',
            document.getElementById('contentSection'),
            `[data-action="open-edit-tester-dialog"]`,
            event => {
                let tester_card = event.closestTarget.closest('[data-element-type="tester-card"]');
                let id = tester_card.getAttribute('data-id');
                let tester_data = this.app_data_model.getTester(id);

                // setup visual and properties
                let dialog_id = event.closestTarget.getAttribute('data-dialog-id');
                let form_node = document.getElementById(dialog_id).querySelector('form');
                form_node.setAttribute('data-action', 'edit-tester');
                form_node.setAttribute('data-tester-id', id);
                let form_button = form_node.querySelector('button[type="submit"]');
                form_button.innerHTML = 'Сохранить';
                let title_node = document.getElementById(dialog_id).querySelector('.dialog-title');
                title_node.innerHTML = 'Изменение данных тестировщика';

                let tester_form_serializer = new TesterSerializer(form_node, tester_data); // clear form
                tester_form_serializer.setValidateVisualController(new SimpleFormValidateVisualController());
                tester_form_serializer.showValidationErrors();
                this.openDialog(dialog_id);
            }
        );
    }
}


let ui_elements;
let app_data_model;
let testers_page_model_view;
let testers_page_controller;

function documentReady() {
    ui_elements = {
        card_list_widget: new CardListWidget(),
    };

    ui_elements.card_list_widget.render();
    ui_elements.card_list_widget.setTo(document.getElementById('contentSection'));

    app_data_model = new AppDataModel();

    testers_page_model_view = new TestersPageModelView(app_data_model, ui_elements);
    testers_page_controller = new TestersPageController(app_data_model, ui_elements);
}

document.addEventListener("DOMContentLoaded", documentReady);