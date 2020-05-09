/**
 * Created by cgkournelos on 13-May-17.
 */


var application = angular.module('courier_web_app', ['ngRoute', 'ngMap', 'ngProgress']);
var history_of_paths = [];
var stores = [];
var hubs = [];

var employees_form_flag;



application.controller('main_controller', function ($rootScope, $scope, $location, $timeout, MyHttp, User) {

        $(".navbar-fixed-top").css("background-color", "transparent");
        $(window).scroll(function(){
            if($(document).scrollTop() > 50){
                $(".navbar-fixed-top").css("background-color", "#222222");
            } else if($location.$$path === "/" || $location.$$path === "/dashboard" ){
                $(".navbar-fixed-top").css("background-color", "transparent");
            }
        });

    $scope.my_login_form = {
        username : '',
        password : '',
        remember : false
    };

    $scope.init = function(){
        $rootScope.userType = 'visitor';
        $rootScope.isLogged = false;
    };



    $scope.login = function(){
        $('#login_modal').modal('hide');
        $('.navbar-collapse').collapse('hide');
        var username = $scope.my_login_form.username;
        var password = $scope.my_login_form.password;

        var data = {
            'action' : 'authenticate_user',
            'username' : username,
            'password' : password
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            // console.log(response.data);
            if(response.data.username){
                User.isLogged = true;
                User.username = response.data.username;
                User.type = response.data.type;
                User.store = response.data.store;
                $rootScope.isLogged = User.isLogged;
                $rootScope.userType = User.type;
                $rootScope.userStore = User.store;

                if($rootScope.userType == 'store_empl'){
                    $rootScope.footerWord = 'Υπάλληλος';
                    $rootScope.name =" - " + response.data.firstname + " " + response.data.lastname;
                    $rootScope.storeName = "- Κατάστημα: " + response.data.storeName;

                }else if($rootScope.userType == 'hub_empl'){
                    $rootScope.footerWord = 'Υπάλληλος';
                    $rootScope.name = " - " + response.data.firstname + " " + response.data.lastname;
                    $rootScope.storeName = "- Transit_hub: " + response.data.storeName;
                }else if($rootScope.userType == 'admin'){
                    $rootScope.footerWord = 'Διαχειρηστής';
                    $rootScope.name = " - " + response.data.firstname + " " + response.data.lastname;
                }else{
                    $rootScope.footerWord = 'επισκέπτης';
                }

                if($rootScope.userType === 'hub_empl'){
                    $location.path('/scan_package');
                }
                else{
                    $location.path('/dashboard');
                }
            }
            else{
                User.isLogged = false;
                User.username = '';
                User.store = '';

            }
        });
    };

    $scope.logout = function () {
        var data = {
            'action' : 'log_out'
        };
        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            if($location.$$path == "/dashboard"){
                $location.path('/');
            }
            else{
                $location.path('/dashboard');
            }


            $rootScope.userType = 'visitor';
            swal({
                title: "Αποσυνδεθήκατε",
                type:"warning",
                timer: 5000,
                showConfirmButton: true
            });

        });
    };

    $scope.contact_us_form = function(){
        console.log($scope.name);
        console.log($scope.email);
        console.log($scope.message);

    };
});

application.controller('package_controller', function ($rootScope, $scope, $location, $timeout, MyHttp, NewPkg){


    $scope.pkg_complete_button = true;
    $scope.pkgDelivered        = false;
    $scope.closest_stores_flag = true;

    $scope.new_pkg = {
        delivery_method: 'standard',
        path_remaining : '',
        tracking_number: '',
        dest_address   : '',
        dest_store     : '',
        start_store    : '',
        cost           : 0,
        time           : 0,
        qr_code        : null
    };

    $scope.stores = '';
    $scope.closest_stores ='';
    $scope.hubs   = '';

    $scope.package = {
        tracking_number  : '',
        readable_path    : '',
        curr_location    : '',
        destination_store: ''
    };

    $scope.disable_submit = true;

    $scope.initMap = function(){
        $timeout(function(){
            var mapCenter = new google.maps.LatLng(38.20149697,21.77284241);
            var mapCanvas = document.getElementById("map_canvas");
            var mapOptions = {center: mapCenter, zoom: 6};
            $scope.map = new google.maps.Map(mapCanvas, mapOptions);
            $scope.mapInfoWindow = new google.maps.InfoWindow();
        }, 100);
    };

    $scope.addMarker = function(coordinate, title){
        $timeout(function(){
            $scope.marker =   new google.maps.Marker({
                position : coordinate,
                map      : $scope.map,
                draggable: false,
                animation: google.maps.Animation.DROP,
                title: title
            });
            google.maps.event.addListener($scope.marker,'click', function(){
                      $scope.mapInfoWindow.setContent(" <b>Περιοχή:</b> " + title + "<br/>");
           			  $scope.mapInfoWindow.open($scope.map, this);
            });
        }, 500);
    };

    $scope.package_search = function(){
        if($scope.package.tracking_number !== ''){
            var trk_number = $scope.package.tracking_number;
            var data       = {
                'action'         : 'pkg_search',
                'tracking_number': trk_number
            };

            var request = MyHttp.post(data);
            MyHttp.send(request, function(response){
                //console.log(response.data);
                if(response.data.coordinates !== -1){
                    if(response.data.delivered == 1){
                        $scope.pkgDelivered = true;
                    }
                    else{
                        $scope.pkgDelivered = false;
                    }
                    $rootScope.pkgShowMap = true;
                    if($scope.pkgDelivered == false){
                        $scope.initMap();
                        var temp_coord = response.data.coordinates.split(",");
                        $scope.addMarker(new google.maps.LatLng(temp_coord[0], temp_coord[1]), response.data.area);
                        $scope.package.readable_path     = response.data.readable_path;
                        $scope.package.curr_location     = response.data.area;
                        $scope.package.destination_store = response.data.destination_store;
                        if($scope.package.destination_store == $rootScope.userStore){
                            $scope.pkg_complete_button = false;
                        }
                    }
                }
                else{
                    $rootScope.pkgShowMap = false;
                    swal({
                        title            : "Λάθος Tracking Number",
                        type             : "error",
                        text             : "Προσπαθήστε ξανά.",
                        timer            : 5000,
                        showConfirmButton: true
                    });
                }

            });
        }
    };

    $scope.package_delivered = function(){
        console.log($scope.package.tracking_number);
        var data = {
            'action' : 'pkg_delivered',
            'tracking_number' : $scope.package.tracking_number
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            console.log(response.data);
            if(response.data == "true" ){
                $scope.pkgDelivered = true;
                swal({
                    title: "Το δέμα"+" <strong>"+$scope.package.tracking_number+"</strong> παραδόθηκε",
                    type:"success",
                    timer: 5000,
                    html: true,
                    showConfirmButton: true
                });
            }
            else{
                swal({
                    title: "Ουπς, καποίο προβλημά συνέβη!",
                    type:"error",
                    text: "Επικοινωνήστε με τον διαχειρηστή.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.load_stores_hubs  = function(){
        var data = {
            'action' : 'network'
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            if(response.data.success){
                $scope.stores = response.data.stores_table;
                for(var i = 0; i < $scope.stores.length; i++){
                    if($scope.stores[i].id === $rootScope.userStore){
                        $scope.current_store_tk = $scope.stores[i].tk;
                        $scope.stores.splice(i, 1);
                    }
                }
                $scope.hubs = response.data.hubs_table;
            }
            else{
                swal({
                    title: "Ουπς, καποίο προβλημά συνέβη!",
                    type:"error",
                    text: "Επικοινωνήστε με τον διαχειρηστή.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.get_pkg_estimation = function(){
        if(angular.isUndefined($scope.new_pkg.dest_store)){
            $scope.disable_submit = true;
            return;
        }
        $scope.new_pkg.start_store = $rootScope.userStore;
        $scope.disable_submit = false;
        var data = {
            'action' : 'pkg_estimation',
            'method' : $scope.new_pkg.delivery_method,
            'curr_store': $scope.new_pkg.start_store,
            'dest_store' : $scope.new_pkg.dest_store
        };
        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            if(!response.data.error_flag){
                $scope.new_pkg.cost = response.data.cost;
                $scope.new_pkg.time = response.data.time;
                $scope.new_pkg.path_remaining = response.data.path;
            }
            else{
                swal({
                    title: "Ουπς, καποίο προβλημά συνέβη!",
                    type:"error",
                    text: "Επικοινωνήστε με τον διαχειρηστή.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.create_trk_number = function(){
        var start_city;
        var dest_city;

        start_city = $scope.current_store_tk;

        for(var i = 0 ; i< $scope.stores.length; i++){
            if($scope.new_pkg.dest_store == $scope.stores[i].id){
                dest_city = $scope.stores[i].tk;
                break;
            }
        }

        var trk_start_store =  start_city;
        var trk_dest_store =  dest_city;

        var dateTime = Date.now();
        var timestamp = Math.floor(dateTime / 1000);
        $scope.new_pkg.tracking_number = trk_start_store.concat(timestamp,trk_dest_store);
        console.log($scope.new_pkg.tracking_number);


        $scope.new_pkg.qr_code = new QRCode( "new_pkg_qr", {
            text: $scope.new_pkg.tracking_number,
            width: 128,
            height: 128,
            correctLevel : QRCode.CorrectLevel.H
        });

        NewPkg.tracking_number = $scope.new_pkg.tracking_number;



        $('#submit_modal').modal('toggle');

    };

    $scope.submit_new_pkg = function(){
        $scope.create_trk_number();
        var data = {
            'action' : 'create_pkg',
            'path_remaining' : $scope.new_pkg.path_remaining,
            'tracking_number': $scope.new_pkg.tracking_number,
            'cost' : $scope.new_pkg.cost,
            'destination_store' : $scope.new_pkg.dest_store,
            'starting_store' : $scope.new_pkg.start_store
        };
        console.log(data);
        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            if(response.data == "false"){
                swal({
                    title: "Ουπς, καποίο προβλημά συνέβη!",
                    type:"error",
                    text: "Επικοινωνήστε με τον διαχειρηστή.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.print_pkg_info = function() {
        $('#submit_modal').modal('hide');
        $timeout(function(){
            $location.path("/print_pkg_info");
        },200);

    };

    $scope.search_closest_store = function(){
        if($scope.new_pkg.dest_address != ""){
            var data = {
                'action' : 'address_search',
                'address': $scope.new_pkg.dest_address
            };

            var request = MyHttp.post(data);
            MyHttp.send(request, function(response){
                if(response.data.length > 0){
                    $scope.closest_stores      = response.data;
                    $scope.new_pkg.dest_store  = $scope.closest_stores[0].id;
                    $scope.closest_stores_flag = false;
                    $scope.get_pkg_estimation();
                }
                else{
                    swal({
                        title            : "Ουπς, καποίο προβλημά συνέβη!",
                        type             : "error",
                        text             : "Επικοινωνήστε με τον διαχειρηστή.",
                        timer            : 5000,
                        showConfirmButton: true
                    });
                }
            });
        }
    };

    $scope.load_stores_hubs();
});

application.controller('print_pkg_controller', function ($rootScope, $scope, $location, $timeout, MyHttp, NewPkg) {
    if($rootScope.userType!="store_empl"){
        $location.path('/');
        return;
    }

    $scope.tracking_number = NewPkg.tracking_number;
    $scope.qr_code = new QRCode( "new_pkg_qr", {
        text: NewPkg.tracking_number,
        width: 400,
        height: 400,
        correctLevel : QRCode.CorrectLevel.H
    });
    $timeout(function(){
        window.print();
        $location.path("/new_package");
    },500);

});

application.controller('network_controller', function ($rootScope, $scope, $location, $timeout, MyHttp, NgMap) {
    $scope.mapInfoWindow = new google.maps.InfoWindow();

    $scope.hubs_flag = true;	
    $scope.stores_flag = true;
    $scope.hub_marker_icon = {
        url: "/courier_web_app/images/custom_marker.png",
        scaledSize: new google.maps.Size(40, 40)
    };
    $scope.search_model = '';
    $scope.closest_stores = '';
    $scope.hide_auto_complete = false;

    $timeout(function(){
        NgMap.getMap().then(function(map){
            $scope.map = map;
            $scope.rmvMarkers(null);
            $scope.load_stores_hubs();
			
        })
    }, 500);

    $scope.load_stores_hubs  = function(){
        var data = {
            'action' : 'network'
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            stores = response.data.stores_table;
            for(var i = 0; i<stores.length; i++){
                var temp_coord = stores[i].coordinates.split(",");
                stores[i].LatLng = [temp_coord[0], temp_coord[1]];
                stores[i].index = i;
                var markLoc = new google.maps.LatLng(temp_coord[0],temp_coord[1]);
                var marker = new google.maps.Marker({ phone: stores[i].telephone, phys_addr:stores[i].physical_address, position:markLoc, map:$scope.map});
                google.maps.event.addListener(marker,'click', function(){
                      $scope.mapInfoWindow.setContent("<b>Oδός:</b> "+ this.phys_addr + "<br/><b>Τηλέφωνο:</b> "+ this.phone + "<br/>");
           			  $scope.mapInfoWindow.open($scope.map, this);
                });

               stores[i].marker = marker;
            }
            hubs   = response.data.hubs_table;
            for(var i = 0; i<hubs.length; i++){
                var temp_coord = hubs[i].coordinates.split(",");
                hubs[i].LatLng = [temp_coord[0], temp_coord[1]];
                hubs[i].index = i;
                var markLoc = new google.maps.LatLng(temp_coord[0],temp_coord[1]);
                var marker = new google.maps.Marker({area: hubs[i].area , position:markLoc, map:$scope.map, icon:$scope.hub_marker_icon});
                 google.maps.event.addListener(marker , 'click', function(){
                 	  $scope.mapInfoWindow.setContent(" <b>Περιοχή:</b> " + this.area + "<br/>");
           			  $scope.mapInfoWindow.open($scope.map, this);
                });
                 hubs[i].marker = marker;
            }
            //console.log($scope.stores)
        });
    };

    $scope.hubs_markers_manager = function (flag){
    	//$scope.myFunc(null);
        if(flag == 0){
            if(document.getElementById("hubs_checkbox").checked){
               for(var i = 0; i <hubs.length; i++){
                   hubs[i].marker.setVisible(true);
              }
            } else{
                for(var i = 0; i <hubs.length; i++){
                   hubs[i].marker.setVisible(false);
                }
                
            }
        }
        else if (flag == 1){
            for(var i = 0; i <hubs.length; i++){
               hubs[i].marker.setVisible(false);
            }
        }

    };

    $scope.stores_markers_manager = function (flag){
        if(flag == 0){
            if(document.getElementById("stores_checkbox").checked){
               for(var i = 0; i < stores.length; i++){
                  stores[i].marker.setVisible(true);
                }
            } else{
               for(var i = 0; i < stores.length; i++){
                stores[i].marker.setVisible(false);
                }
            }
        }
        else if(flag == 1 ){
           for(var i = 0; i < stores.length; i++){
               stores[i].marker.setVisible(false);
            }
        }
    };

    $scope.hide_all_markers = function(){
        $scope.stores_markers_manager(1);
        $scope.hubs_markers_manager(1);
    };

    $scope.show_all_markers = function(){
    	for(var i = 0; i < stores.length; i++){
                  stores[i].marker.setVisible(true);
        }
        for(var i = 0; i < hubs.length; i++){
                  hubs[i].marker.setVisible(true);
        }
        document.getElementById("stores_checkbox").checked = true;
        document.getElementById("hubs_checkbox").checked = true;

        $scope.map.setCenter(new google.maps.LatLng(38.20149697,21.77284241));
        $scope.map.setZoom(6);

    };

    $scope.rmvMarkers = function(map){			// deleting all previous markers

        for(var i=0 ; i<stores.length;i++){
            stores[i].marker.setMap(map);
        }
        for(var j=0; j<hubs.length;j++){
            hubs[j].marker.setMap(map);
        }

    };

    $scope.show_specific_markers = function(lat, lng){
        $scope.hide_all_markers();
        document.getElementById("stores_checkbox").checked = false;
        document.getElementById("hubs_checkbox").checked = false;
        for(var i = 0; i < stores.length; i++){
            if((stores[i].lat == lat) && (stores[i].lng == lng)){
                stores[i].marker.setVisible(true);
                var tempLatLng =  new google.maps.LatLng(lat,lng);
                $scope.map.setCenter(tempLatLng);
                $scope.map.setZoom(8);
                //console.log(stores[i])
                //$scope.mapInfoWindow.open($scope.map,stores[i].marker);
                $scope.mapInfoWindow.setContent("<b>Oδός:</b> "+ stores[i].marker.phys_addr + "<br/><b>Τηλέφωνο:</b> "+ stores[i].marker.phone + "<br/>");
           		$scope.mapInfoWindow.open($scope.map, stores[i].marker);
            }
        }
    };

    $scope.search_near_tk = function(){
        var data = {
            'action' : 'postal_search',
            'postal_code' : $scope.search_model
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            console.log(response.data);
            if("39.3659294,21.9217573" != response.data.coordinates){
                $scope.show_specific_markers(response.data.lat, response.data.lng);
            }
            else{
                swal({
                    title: "To TK που πληκτρολογήσατε δεν βρέθήκε.",
                    type:"error",
                    text: "Προσπαθήστε ξανά.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.search_near_city = function(city){
        var data = {
            'action' : 'city_search',
            'city' : city
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
        	if(response.data == -1){
        		$scope.closest_stores = '';
        		return;
        	}
            $scope.closest_stores = response.data.slice();
            //console.log($scope.closest_stores);
        });
    };

    $scope.search_form_input = function(){
    	if($scope.search_model.length==0){
    		//alert("CANT SEND EMPTY");
    		return;
    	}
        if(!isNaN($scope.search_model) && $scope.search_model.length==5){
            $scope.search_near_tk();
        }
    };

    $scope.search_form_autocomplete = function(event,input){
    		if(input.length==0){
    			$scope.mapInfoWindow.close();
    			document.getElementById("myBtn").disabled = false;
    			$scope.show_all_markers();
    			$scope.closest_stores = '';
    			return;
    		}
	        if(isNaN(input)){
	            if(input){
	            	document.getElementById("myBtn").disabled = true;
	                $scope.hide_auto_complete = false;
	                $scope.search_near_city(input);
	            }
	            else{
	                $scope.hide_auto_complete = true;
	            }
	        }else{
	        	document.getElementById("myBtn").disabled = false;
	        }
    };

    $scope.show_list = function(){
    	$scope.hide_auto_complete = false;
    };

    $scope.fill_text_box = function(store){
    	$scope.show_specific_markers(store.lat,store.lng);
        $scope.search_model = store.physical_address;
    	$scope.hide_auto_complete = true;
    };

});

application.controller('stores_controller', function($rootScope, $scope, $location, $timeout, MyHttp, Store){

    if($rootScope.userType!="admin"){
        $location.path('/');
        return;
    }

    $scope.stores = '';
    $scope.hubs = '';
    $scope.coor_estimation = false;

    if($rootScope.action == "edit_store"){
        $scope.store_form = {
            id         : '',
            name       : Store.name,
            street     : Store.street,
            st_number  : Store.st_number,
            city       : Store.city,
            tk         : Store.tk,
            telephone  : Store.telephone,
            coordinates: Store.coordinates,
            transit_hub: Store.transit_hub
        };
    }
    else{
        $scope.store_form = {
            id         : '',
            name       : '',
            street     : '',
            st_number  : '',
            city       : '',
            tk         : '',
            telephone  : '',
            coordinates: '',
            transit_hub: ''
        };
    }

    $scope.load_stores_hubs  = function(){
        var data = {
            'action' : 'network'
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            if(response.data.success){
                $scope.stores = response.data.stores_table;
                $scope.hubs   = response.data.hubs_table;
            }
            else{
                swal({
                    title: "Ουπς, καποίο προβλημά συνέβη!",
                    type:"error",
                    text: "Επικοινωνήστε με τον διαχειρηστή.",
                    timer: 5000,
                    showConfirmButton: true
                });
            }
        });
    };

    $scope.deleteStore = function(index,store){
        // $scope.stores.splice(index,1);
        var data = {
            'action' : 'store_packages',
            'store_id' : store.id,
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            console.log(response.data);
            if(response.data == "0"){
                var data = {
                    'action' : 'delete_store',
                    'store_id' : store.id,
                    'connected_hub' : store.transit_hub
                };
                $scope.stores.splice(index,1);
                var request = MyHttp.post(data);
                MyHttp.send(request,function(response){

                });
            }
            else{
                swal({
                        title: "Το κατάστημα έχει εξαρτώμενα δέματα και υπαλλήλους!",
                        text: "Είστε σίγουρος για την διαγραφή;",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Ναι",
                        cancelButtonText: "Οχι",
                        closeOnConfirm: false,
                        closeOnCancel: false
                    },
                    function(isConfirm){
                        if (isConfirm) {
                            swal("Διεγράφει!", "Το κατάστημα τα δέματα και οι υπαλληλοι διαγράφτηκαν", "success");
                            var data = {
                                'action' : 'delete_store',
                                'store_id' : store.id,
                                'connected_hub' : store.transit_hub
                            };

                            var request = MyHttp.post(data);
                            $scope.stores.splice(index,1);
                            MyHttp.send(request,function(response){

                            });
                        } else {
                            swal("Ακύρωση", "Το κατάστημα δεν διαγράφτηκε", "error");
                        }
                    });
            }

        });
    };

    $scope.fillFormData = function(store){
        Store.id = store.id;
        Store.name = store.name;
        Store.street = store.street;
        Store.st_number = store.st_number;
        Store.city = store.city;
        Store.tk = store.tk;
        Store.telephone = store.telephone;
        Store.coordinates = store.coordinates;
        Store.transit_hub = store.transit_hub;
    };

    $scope.editStore = function(index){
        if(index < 0){
            $rootScope.action = "create_store";
        }
        else{
            $rootScope.action = "edit_store";
            $scope.fillFormData($scope.stores[index]);
        }
        $location.path('/store_form');
    };

    $scope.sortTable = function(n){
        var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        table = document.getElementById("storesTable");
          switching = true;

          dir = "asc"; 
          while (switching) {
            switching = false;
            rows = table.getElementsByTagName("TR");

            for (i = 1; i < (rows.length - 1); i++) {

              shouldSwitch = false;

              x = rows[i].getElementsByTagName("TD")[n];
              y = rows[i + 1].getElementsByTagName("TD")[n];

              if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                  shouldSwitch= true;
                  break;
                }
              } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                  shouldSwitch= true;
                  break;
                }
              }
            }
            if (shouldSwitch) {
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              switchcount ++; 
            } else {
              if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
              }
            }
          }
    }

    $scope.submitStoreData = function (){
        $scope.store_form.id = Store.id;
        var data = {
            'action' : $rootScope.action,
            'new_store' :   $scope.store_form
        };
        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            $location.path('/stores');
        });
    };

    $scope.estimate_coordinates = function(){
        $('#coordinates').addClass('loadinggif');
        if($scope.store_form.street && $scope.store_form.st_number && $scope.store_form.city && $scope.store_form.tk){
            var data = {
                'action' : "get_new_store_coor",
                'address' :   $scope.store_form.street+" "+$scope.store_form.st_number+" "+$scope.store_form.city+", "+$scope.store_form.tk
            };
            var request = MyHttp.post(data);
            MyHttp.send(request,function(response){
                console.log(response.data);
                if("39.074208,21.824312"!==response.data){
                    $scope.coor_estimation =false;
                    console.log(response.data);
                    $scope.store_form.coordinates = response.data;
                    $('#coordinates').removeClass('loadinggif');
                }
                else{
                    $scope.store_form.coordinates = "";
                    $scope.coor_estimation =true;
                    $('#coordinates').removeClass('loadinggif');
                }
            });
        }
    };

    $scope.load_stores_hubs();

});

application.controller('employees_controller', function($rootScope, $scope, $location, $timeout, MyHttp, Employee){
    if($rootScope.userType!="admin"){
        $location.path('/');
        return;
    }

    $scope.hubs_employees = '';
    $scope.stores_employees = '';

    $scope.stores          = '';
    $scope.hubs            = '';
    $scope.invalidUsername = false;

    if(employees_form_flag === 1){
        $scope.storeField = false;
        $scope.hubField = true;
    }else if(employees_form_flag === 2){
        $scope.storeField = true;
        $scope.hubField = false;
    }

    if($rootScope.action == "edit_employee"){
        $scope.employee_form = {
            id              : '',
            firstname       : Employee.firstname,
            lastname        : Employee.lastname,
            username        : Employee.username,
            password        : Employee.password,
            type            : Employee.type,
            transit_hub     : Employee.transit_hub,
            store           : Employee.store
        };
    }
    else{
        $scope.employee_form = {
            id          : '',
            firstname   : '',
            lastname    : '',
            username    : '',
            password    : '',
            type        : '',
            transit_hub : '',
            store       : ''
        };
    }

    $scope.showPass = function(){
        console.log("HEY");
        var obj = document.getElementById('password');
        if(obj.type == "text"){
            obj.type = 'password';
        }else if(obj.type == 'password'){
            obj.type = 'text';
        }
    };


    $scope.load_employees  = function(){
        var data = {
            'action' : 'get_employees'
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            $scope.stores_employees = response.data.stores_employees;
            $scope.hubs_employees   = response.data.hubs_employees;
        });
    };

    $scope.delete_store_Employee = function(index,store_employee){
        $scope.stores_employees.splice(index,1);
        var data = {
            'action' : 'delete_store_employee',
            'store_employee_id' : store_employee.id,
            'store' : store_employee.store
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
        });
    };

    $scope.load_stores_hubs  = function(){
        var data = {
            'action' : 'network'
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            $scope.stores = response.data.stores_table;
            $scope.hubs   = response.data.hubs_table;
        });
    };

    $scope.valid_username = function(event,input){
        if(input.length == 0){}
        else{

            var data = {
                'action': 'check_if_valid_username',
                'name'  : input
            };

            var request = MyHttp.post(data);
            MyHttp.send(request, function(response){
                console.log(response.data);
                if(response.data == 'false'){
                    $scope.invalidUsername = true;
                }
                else{
                    $scope.invalidUsername = false;
                }
            });
        }
    };
   
    $scope.delete_hub_Employee = function(index,hub_employee){
        $scope.hubs_employees.splice(index,1);
        var data = {
            'action' : 'delete_hub_employee',
            'hub_employee_id' : hub_employee.id,
            'transit_hub' : hub_employee.transit_hub
        };

        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
        });
    };

    $scope.fillFormData = function(employee){
        Employee.id = employee.id;
        Employee.firstname = employee.firstname;
        Employee.lastname = employee.lastname;
        Employee.username = employee.username;
        Employee.password = employee.password;
        Employee.type = employee.type;
        Employee.transit_hub = employee.transit_hub;
        Employee.store = employee.store;
    };

    $scope.sortTable = function(n,table){
        var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        table = document.getElementById(table);
          switching = true;

          dir = "asc"; 
          while (switching) {
            switching = false;
            rows = table.getElementsByTagName("TR");

            for (i = 1; i < (rows.length - 1); i++) {

              shouldSwitch = false;

              x = rows[i].getElementsByTagName("TD")[n];
              y = rows[i + 1].getElementsByTagName("TD")[n];

              if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                  shouldSwitch= true;
                  break;
                }
              } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                  shouldSwitch= true;
                  break;
                }
              }
            }
            if (shouldSwitch) {
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              switchcount ++; 
            } else {
              if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
              }
            }
          }
    }

    $scope.editEmployee = function(index,button){
        employees_form_flag = button;
        if(index < 0){
            $rootScope.action = "create_employee";
        }
        else{
            $rootScope.action = "edit_employee";
            if(button==1){
                $scope.fillFormData($scope.stores_employees[index]);
            }else if(button==2){
                $scope.fillFormData($scope.hubs_employees[index]);
            }
        }
        $location.path('/employee_form');
    };

    $scope.submitEmployeeData = function (){
        $scope.employee_form.id = Employee.id;
        if($scope.employee_form.transit_hub===""){
            $scope.employee_form.transit_hub = '-1';
        }
        if($scope.employee_form.store===""){
            $scope.employee_form.store = '-1';
        }
        var data = {
            'action' : $rootScope.action,
            'new_employee' : $scope.employee_form
        };
        var request = MyHttp.post(data);
        MyHttp.send(request,function(response){
            $location.path('/employees');
        });
    };

    $scope.load_stores_hubs();

    $scope.load_employees();

});

application.controller('scan_controller',function($rootScope, $scope, $location, $timeout, MyHttp){
    // TODO add https cerficate to Apache https://stackoverflow.com/questions/4221874/how-do-i-allow-https-for-apache-on-localhost
    // TODO Add sound on scanning

    // var sound = new Audio("sounds/beep.mp3");

    if($rootScope.userType!="hub_empl"){
         $location.path('/');
         return;
    }

    $scope.currCamera;

    let trk_pattern=/^[0-9]{20}$/;

    let opts = {
        // Whether to scan continuously for QR codes. If false, use scanner.scan() to manually scan.
        // If true, the scanner emits the "scan" event when a QR code is scanned. Default true.
        continuous: true,

        // The HTML element to use for the camera's video preview. Must be a <video> element.
        // When the camera is active, this element will have the "active" CSS class, otherwise,
        // it will have the "inactive" class. By default, an invisible element will be created to
        // host the video.
        video: document.getElementById('preview'),

        // Whether to horizontally mirror the video preview. This is helpful when trying to
        // scan a QR code with a user-facing camera. Default true.
        mirror: false,

        // Whether to include the scanned image data as part of the scan result. See the "scan" event
        // for image format details. Default false.
        captureImage: false,

        // Only applies to continuous mode. Whether to actively scan when the tab is not active.
        // When false, this reduces CPU usage when the tab is not active. Default true.
        backgroundScan: false,

        // Only applies to continuous mode. The period, in milliseconds, before the same QR code
        // will be recognized in succession. Default 5000 (5 seconds).
        refractoryPeriod: 5000,

        // Only applies to continuous mode. The period, in rendered frames, between scans. A lower scan period
        // increases CPU usage but makes scan response faster. Default 1 (i.e. analyze every frame).
        scanPeriod: 1
    };

    $rootScope.scanner = new Instascan.Scanner(opts);

    $rootScope.scanner.addListener('scan', function (content) {
        // sound.play();
        console.log(content);
        if(trk_pattern.test(content)){
            var data = {
                'action' : 'update_pkg',
                'tracking_number' : content,
                'hub_id' :  $rootScope.userStore
            };
            var request = MyHttp.post(data);
            MyHttp.send(request,function(response){
                console.log(response.data);
                if(response.data == -1){
                    swal({
                        title: "This package should not be here",
                        type:"error",
                        text: "close in 5 seconds.",
                        timer: 5000,
                        showConfirmButton: true
                    });
                }
                else{
                    swal({
                        title: "OK",
                        type:"success",
                        text: "close in 5 seconds.",
                        timer: 5000,
                        showConfirmButton: true
                    });
                }
            });
        }
        else{
            swal({
                title: "QR reader cannot detect tracking number",
                type:"warning",
                text: "close in 5 seconds.",
                timer: 5000,
                showConfirmButton: true
            });
        }
    });

    Instascan.Camera.getCameras().then(function (cameras) {
        $scope.cameras = cameras;
        if($scope.cameras.length > 0){
            $scope.disableChange = true;
            $scope.currCamera = 0;
            $rootScope.scanner.start($scope.cameras[$scope.currCamera]);
        }
        else{
            console.log("No camera found");
        }
         if($scope.cameras.length <= 1){
             document.getElementById("change_button").disabled = true;
        }else{
             document.getElementById("change_button").disabled = false;
        }
    }).catch(function (e) {
        console.error(e);
        swal({
            title: "Error opening your camera",
            type:"error",
            text: "close in 5 seconds.",
            timer: 5000,
            showConfirmButton: true
        });
    });


    $scope.change_camera = function(){
        if($scope.cameras.length > 1){
            if($scope.currCamera == ($scope.cameras.length - 1)){
                $scope.currCamera == 0;
                $rootScope.scanner.stop();  // not sure about this
                $rootScope.scanner.start($scope.cameras[$scope.currCamera]);
            }
            else{
                $scope.currCamera += 1;
                $rootScope.scanner.stop();  // not sure about this
                $rootScope.scanner.start($scope.cameras[$scope.currCamera]);
            }
        }    
    }

});