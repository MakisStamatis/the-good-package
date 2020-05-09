/**
 * Created by cgkournelos on 14-May-17.
 */

application.config(function($routeProvider){
   $routeProvider.when('/', {
       templateUrl : 'partials/dashboard.html',
       controller : 'main_controller'
   }).when('/dashboard', {
       templateUrl : 'partials/dashboard.html',
       controller : 'main_controller'
   }).when('/package', {
       templateUrl : 'partials/package.html',
       controller : 'package_controller'
   }).when('/new_package', {
       templateUrl : 'partials/new_package.html',
       controller : 'package_controller'
   }).when('/print_pkg_info', {
       templateUrl : 'partials/print_pkg_info.html',
       controller : 'print_pkg_controller'
   }).when('/network', {
       templateUrl : 'partials/network.html',
       controller : 'network_controller'
   }).when('/stores', {
       templateUrl : 'partials/stores.html',
       controller : 'stores_controller'
   }).when('/store_form', {
       templateUrl : 'partials/store_form.html',
       controller : 'stores_controller'
   }).when('/employees', {
       templateUrl : 'partials/employees.html',
       controller : 'employees_controller'
   }).when('/employee_form', {
       templateUrl : 'partials/employee_form.html',
       controller : 'employees_controller'
   }).when('/scan_package', {
       templateUrl : 'partials/scan_package.html',
       controller : 'scan_controller'
   });
});

application.run(function($rootScope, $location, checkLogin){
    $rootScope.$on("$routeChangeStart", function(event, next, current){
        $rootScope.pkgShowMap = false;
        $(".navbar-fixed-top").css("background-color", "#222222");
        if(history_of_paths.length > 1){
            if(current.$$route.originalPath === "/scan_package"){
                if(typeof $rootScope.scanner !== 'undefined'){
                  $rootScope.scanner.stop();
                }
            }
        }
        checkLogin.check(function(response){
            $rootScope.isLogged = response.isLogged;
            $rootScope.userType = response.type;
            $rootScope.userStore = response.store;
            $rootScope.firstname = response.firstname;
            $rootScope.lastname = response.lastname;
            $rootScope.storeName = response.storeName;
            if(!$rootScope.userType){
                $rootScope.userType = 'visitor';
            }

           if($rootScope.userType == 'store_empl'){
                $rootScope.footerWord = 'Yπάλληλος';
                $rootScope.name =" - " + response.firstname + " " + response.lastname;
                $rootScope.storeName = " - Κατάστημα: " + response.storeName;
            }else if($rootScope.userType == 'hub_empl'){
                $rootScope.footerWord = 'Yπάλληλος';
                $rootScope.name =" - " + response.firstname + " " + response.lastname;
                $rootScope.storeName = " - Transit_hub: " + response.storeName;
            }else if($rootScope.userType == 'admin'){
                $rootScope.footerWord = 'Διαχειρηστής';
                $rootScope.name =" - " + response.firstname + " " + response.lastname;
            }else{
                $rootScope.footerWord = 'επισκέπτης';
                $rootScope.name = undefined;
                $rootScope.storeName = undefined;
          }
        });
    });
    $rootScope.$on('$routeChangeSuccess', function() {
       history_of_paths.push($location.$$path);
    });
});