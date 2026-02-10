import { LightningElement, wire, track } from 'lwc';
import getFilteredAccounts from '@salesforce/apex/AccountController.getFilteredAccounts';
import createAccessRequest from '@salesforce/apex/AccountController.createAccessRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RequestClientAccess extends LightningElement {
    @track searchTerm = '';
    @track selectedType = '';
    @track showForm = false;
    @track selectedAccount = {};
    @track isIndefinite = false;
    
    // Form data
    @track startDate;
    @track endDate;
    @track notes = '';
    
    // Nombre del usuario actual (puedes hardcodearlo para la demo o dejarlo dinámico)
    currentUserName = 'Current User'; 

    // --- AQUÍ ESTÁ EL CAMBIO EN LAS COLUMNAS ---
    columns = [
        { label: 'Name', fieldName: 'Name', sortable: true }, // Mantiene la flechita
        { label: 'Client Code', fieldName: 'AccountNumber', sortable: false }, // Sin flechita
        { label: 'Practice', fieldName: 'PracticeName', sortable: false }, // Sin flechita
        { label: 'Approver', fieldName: 'ApproverName', sortable: false }, // Sin flechita
        { label: 'Region', fieldName: 'Region', sortable: false }, // Sin flechita
        { 
            label: 'Request', // Título agregado en la última columna
            type: 'button', 
            typeAttributes: { 
                label: 'Request Access', 
                name: 'request', 
                variant: 'base' 
            },
            cellAttributes: { class: 'violet-button' }
        }
    ];

    @wire(getFilteredAccounts, { searchTerm: '$searchTerm', recordTypeName: '$selectedType' })
    accounts;

    handleRowAction(event) {
        this.selectedAccount = event.detail.row;
        this.showForm = true;
    }

    handleCancel() {
        this.showForm = false;
        this.resetFields();
    }

    handleInputChange(event) {
        const label = event.target.label;
        if (label === 'Start Date') this.startDate = event.target.value;
        else if (label === 'End Date') this.endDate = event.target.value;
        else if (label === 'Notes') this.notes = event.target.value;
        else if (label === 'Indefinite') this.isIndefinite = event.target.checked;
    }

    handleSubmit() {
        if (!this.startDate) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Start Date is required', variant: 'error' }));
            return;
        }

        createAccessRequest({
            accountId: this.selectedAccount.Id,
            startDate: this.startDate,
            endDate: this.endDate,
            indefinite: this.isIndefinite,
            notes: this.notes
        })
        .then(() => {
            this.dispatchEvent(new ShowToastEvent({ title: 'Success', message: 'Request submitted!', variant: 'success' }));
            this.showForm = false;
            this.resetFields();
        })
        .catch(error => {
            console.error(error);
            this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Submission failed', variant: 'error' }));
        });
    }
    
    handleSearch(event) { this.searchTerm = event.target.value; }
    handleTypeChange(event) { this.selectedType = event.target.value; }

    resetFields() {
        this.startDate = null;
        this.endDate = null;
        this.notes = '';
        this.isIndefinite = false;
    }

    get recordTypeOptions() {
        return [
            { label: 'Families', value: 'Family' },
            { label: 'Households', value: 'Household' },
            { label: 'Person Accounts', value: 'Person Account' }
        ];
    }
}
