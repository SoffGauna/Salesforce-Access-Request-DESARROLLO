public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper> getFilteredAccounts(String searchTerm, String recordTypeName) {
        List<AccountWrapper> wrapperList = new List<AccountWrapper>();
        
        // Ahora usamos todos los campos que creaste
        String query = 'SELECT Id, Name, AccountNumber, Practice__r.Name, Practice__r.Approver__r.Name, ' +
                       'Practice__r.Region__c, Terminated__c ' +
                       'FROM Account WHERE Name LIKE :nameFilter';
        
        if (String.isNotBlank(recordTypeName)) {
            query += ' AND RecordType.Name = :recordTypeName';
        }
        
        String nameFilter = '%' + searchTerm + '%';
        
        for (Account acc : Database.query(query)) {
            AccountWrapper wrap = new AccountWrapper();
            wrap.Id = acc.Id;
            wrap.Name = acc.Name;
            wrap.AccountNumber = acc.AccountNumber;
            wrap.PracticeName = acc.Practice__r != null ? acc.Practice__r.Name : 'N/A';
            wrap.ApproverName = (acc.Practice__r != null && acc.Practice__r.Approver__r != null) ? acc.Practice__r.Approver__r.Name : 'N/A';
            wrap.Region = acc.Practice__r != null ? acc.Practice__r.Region__c : 'N/A';
            wrap.Terminated = acc.Terminated__c;
            wrapperList.add(wrap);
        }
        return wrapperList;
    }

    @AuraEnabled
    public static void createAccessRequest(Id accountId, String startDate, String endDate, Boolean indefinite, String notes) {
        Case c = new Case();
        c.AccountId = accountId;
        c.Status = 'Submitted'; // Esto gatilla el Proceso de Aprobación
        c.Origin = 'Web';
        c.Type = 'Request Client Access';
        
        // Mapeo de campos creados
        c.Start_Date__c = Date.valueOf(startDate);
        if(!indefinite && endDate != null) {
            c.End_Date__c = Date.valueOf(endDate);
        }
        c.Indefinite__c = indefinite;
        c.Client_Access_Notes__c = notes;
        
        insert c;
    }

    public class AccountWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public String AccountNumber;
        @AuraEnabled public String PracticeName;
        @AuraEnabled public String ApproverName;
        @AuraEnabled public String Region;
        @AuraEnabled public Boolean Terminated;
    }
}
