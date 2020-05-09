/**
 * Created by cgkournelos on 14-May-17.
 */

application.factory('MyHttp', function($http){
    var base_url = "/courier_web_app/php/server.php";

    return {
        post : function(form_data){
            var request = $http({
                method : 'post',
                url : base_url,
                data :form_data
            });

            return request;
        },

        send : function (request, callback){
            request.then(function(response){
                callback(response);
            }).catch(function(Object){
                alert(Object.data);
            });
        }
    }
});

application.factory('User', function(){
    var obj = {
        isLogged : false,
        type : '',
        username : '',
        store: ''
    };
    return obj;
});

application.factory('checkLogin', function($rootScope, MyHttp, User){
    return {
        check : function(callback){
            var data ={
                'action' : 'check_if_logged_in'
            };
            var request = MyHttp.post(data);
            MyHttp.send(request,function(response){
                if(response.data.username){
                    User.isLogged = true;
                    User.type = response.data.user_type;
                    User.username = response.data.username;
                    User.store = response.data.user_store;
                    User.firstname = response.data.firstname;
                    User.lastname = response.data.lastname;
                    User.storeName = response.data.storeName;
                }
                else{
                    User.isLogged = false;
                    User.username = '';
                    User.type = '';
                    User.store = '';
                    User.firstname = '';
                    User.lastname = '';
                    User.storeName = '';
                }
                callback(User);
            });
        }
    }
});

application.factory('NewPkg', function(){
    var obj = {
        delivery_method: 'standard',
        path_remaining : '',
        tracking_number: '',
        dest_address   : '',
        dest_store     : '',
        start_store    : '',
        cost           : '',
        time           :'',
        qr_code : ''
    };
    return obj;
});

application.factory('Store', function(){
    var obj = {
        id: '',
        name: '',
        street: '',
        st_number: '',
        city: '',
        tk: '',
        telephone: '',
        coordinates: '',
        transit_hub: ''
    };
    return obj;
});

application.factory('Employee', function(){
    var obj = {
        id: '',
        firstname: '',
        lastname: '',
        username: '',
        type:'',
        transit_hub: '',
        store: ''
    };
    return obj;
});