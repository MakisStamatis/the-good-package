<?php
/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 14-May-17
 * Time: 4:49 AM
 */

require ("db_connector.php");

$json_data = file_get_contents("php://input");
$data = json_decode($json_data);

$server_action = $data->action;

if($server_action == 'authenticate_user'){
    $db_handler = new Database();
    $result = $db_handler->authenticate($data->username, $data->password);
    echo json_encode($result);
}
else if ($server_action == 'check_if_logged_in'){
    $db_handler = new Database();
    $result = $db_handler->get_session_data();
    echo json_encode($result);
}
else if ($server_action == 'check_if_valid_username'){
    $db_handler = new Database();
    $result = $db_handler->check_if_valid_username($data->name);
    echo  json_encode($result);
}
else if ($server_action == 'log_out'){
    $db_handler = new Database();
    $db_handler->logout();
}
else if($server_action == 'pkg_delivered'){
    $db_handler = new Database();
    $result =$db_handler->package_delivered($data->tracking_number);
    echo  json_encode($result);
}
else if($server_action == 'pkg_search'){
    $db_handler = new Database();
    $result = $db_handler->package_search($data->tracking_number);
    echo  json_encode($result);
}
else if($server_action == 'pkg_estimation'){
    $db_handler = new Database();
    $result = $db_handler->package_estimation($data->method, $data->curr_store, $data->dest_store);
    echo  json_encode($result);
}
else if($server_action == 'create_pkg'){
    $db_handler = new Database();
    $result = $db_handler->create_package($data->path_remaining, $data->tracking_number, $data->cost, $data->destination_store ,$data->starting_store);
    echo  json_encode($result);
}
else if($server_action == 'update_pkg'){
    $db_handler = new Database();
    $result = $db_handler->update_pkg_location($data->tracking_number, $data->hub_id);
    echo  json_encode($result);
}
else if($server_action == 'network'){
    $db_handler = new Database();
    $result = $db_handler->network_of_stores();
    echo  json_encode($result);
}
else if($server_action == 'postal_search'){
    $db_handler = new Database();
    $result = $db_handler->nearest_store_by_tk($data->postal_code);
    echo  json_encode($result);
}
else if($server_action == 'city_search'){
    $db_handler = new Database();
    $result = $db_handler->nearest_store_by_city($data->city);
    echo  json_encode($result);
}
else if($server_action == 'address_search'){
    $db_handler = new Database();
    $result = $db_handler->nearest_store_by_address($data->address);
    echo  json_encode($result);
}
else if($server_action == 'get_new_store_coor'){
    $db_handler = new Database();
    $result = $db_handler->get_new_store_coordinates($data->address);
    echo ($result);
}
else if($server_action == 'store_packages'){
    $db_handler = new Database();
    $result = $db_handler->store_packages($data->store_id);
    echo ($result);
}
else if($server_action == 'delete_store'){
    $db_handler = new Database();
    $db_handler->delete_store($data->store_id,$data->connected_hub);
}
else if($server_action == 'create_store'){
    $db_handler = new Database();
    $new_store = $data->new_store;
    $db_handler->create_store($new_store);
}
else if($server_action == 'edit_store'){
    $db_handler = new Database();
    $new_store = $data->new_store;
    $db_handler->edit_store($new_store);
}
else if($server_action == 'get_employees'){
    $db_handler = new Database();
    $result = $db_handler->network_of_employees();
    echo  json_encode($result);
}
else if($server_action == 'delete_store_employee'){
    $db_handler = new Database();
    $db_handler->delete_store_employee($data->store_employee_id,$data->store);
}
else if($server_action == 'delete_hub_employee'){
    $db_handler = new Database();
    $db_handler->delete_hub_employee($data->hub_employee_id,$data->transit_hub);
}
else if($server_action == 'create_employee'){
    $db_handler = new Database();
    $new_employee = $data->new_employee;
    $db_handler->create_employee($new_employee);
}
else if($server_action == 'edit_employee'){
    $db_handler = new Database();
    $new_employee = $data->new_employee;
    $db_handler->edit_employee($new_employee);
}
