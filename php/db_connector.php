<?php
/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 14-May-17
 * Time: 4:22 AM
 */

require ("Package.php");
require("User.php");
require ("Stores.php");
require ("Employees.php");
require ("Graph.php");


/**
 * Class Connection
 * @brief This class implements the connection with the MySQL DB.
 */
class Connection {
    public function getConnection(){
        $server_address = "localhost";
        $username = "root";
        $password = "";
        $database_name = "courierdb";

        $conn = new mysqli($server_address, $username, $password, $database_name) or die ( $conn->error.__LINE__);

        if($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        mysqli_set_charset($conn, "utf8");

        return $conn;
    }
}

/**
 * Class Database
 * @brief This class handles the Database
 */
class Database {
    private $conn = null;

    /**
     * Database constructor.
     */
    public function __construct(){
        $connection = new Connection();
        $this->conn =$connection->getConnection();
    }

    /**
     *
     */
    function __destruct() {
        $closeResults = $this->conn->close();
    }

    /**
     * With this function implements the authentication of user
     * @param $username
     * @param $password
     * @return mixed the username in case of connection or empty in other case
     */
    public function authenticate($username, $password){
        $user = new User($username, $password, $this->conn);
        $this->set_session($user->username, $user->type, $user->store , $user->firstname , $user->lastname , $user->storeName);
        return $user->jsonSerialize();
    }

    /**
     * @param string $user
     * @param string $type
     * @param string $store
     * @param string $firstname
     * @param string $lastname
     * @param $storeName
     */
    public function set_session($user = '',$type = '',$store = '',$firstname = '',$lastname = '' , $storeName){
        if(!isset($_SESSION)){
            session_start();
        }
        if(!empty($user)){
            $_SESSION['username'] = $user;
            $_SESSION['user_type'] = $type;
            $_SESSION['user_store'] = $store;
            $_SESSION['firstname'] = $firstname;
            $_SESSION['lastname'] = $lastname;
            $_SESSION['storeName'] = $storeName;
        }
        else{
            $_SESSION['username'] = '';
            $_SESSION['user_type'] = '';
            $_SESSION['user_store'] = '';
            $_SESSION['firstname'] = '';
            $_SESSION['lastname'] = '';
            $_SESSION['storeName'] = '';
        }
    }

    /**
     * @return mixed
     */
    public function get_session_data(){
        if(!isset($_SESSION)){
            session_start();
        }
        if(isset($_SESSION['username'])){
            $data['username'] = $_SESSION['username'];
            $data['user_type'] = $_SESSION['user_type'];
            $data['user_store'] = $_SESSION['user_store'];
            $data['firstname'] = $_SESSION['firstname'];
            $data['lastname'] = $_SESSION['lastname'];
            $data['storeName'] = $_SESSION['storeName'];
        }
        else{
            $data['username'] = '';
            $data['user_type'] = '';
            $data['user_store'] = '';
            $data['firstname'] = '';
            $data['lastname'] = '';
            $data['storeName'] = '';

        }
        return $data;
    }

    public function check_if_valid_username($name){
        $result = mysqli_query($this->conn,"SELECT `username` FROM `χρήστης` WHERE `username`='$name'");

        if($result->num_rows==0){
            return true;
        }
        else{
            return false;
        }
    }

    /**
     *
     */
    public function logout(){
        if(!isset($_SESSION)){
            session_start();
        }
        session_unset();
        session_destroy();
    }

    /**
     * @param $trk
     * @return array
     */
    public function package_search($trk){
        $package = new Package($trk, $this->conn);
        return $package->jsonSerialize();
    }

    /**
     * @param $trk
     * @return bool
     */
    public function package_delivered($trk){
       $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `delivered`= 1 WHERE `tracking_number`='".$trk."'" );
       if($result == false){
           return false;
       }
       else{
           return true;
       }

    }

    /**
     * @param $method
     * @param $curr_store
     * @param $dest_store
     * @return array
     * @internal param $dest_storeσ
     */
    public function package_estimation($method, $curr_store, $dest_store){
        $estimation = new Graph($this->conn, $method,$curr_store, $dest_store);
        return $estimation->jsonSerialize();
    }

    /**
     * @param $path_remaining_table
     * @param $tracking_number
     * @param $cost
     * @param $destination_store
     * @param $starting_store
     * @internal param $path_remaining
     * @return string
     */
    public function create_package($path_remaining_table, $tracking_number, $cost, $destination_store , $starting_store){
        $path_remaining = implode(",", $path_remaining_table);
        $result = mysqli_query($this->conn, "INSERT INTO `δέμα` (`tracking_number`,`starting_store`,`path_remaining`,`cost`,`destination_store`) 
                                          VALUES ('$tracking_number','$starting_store','$path_remaining', '$cost', '$destination_store')");

        return $result;
    }

    /**
     *
     */
    public function update_pkg_location($tracking_number, $transit_hub){
        $result = mysqli_query($this->conn,"SELECT * FROM `δέμα` WHERE `tracking_number`='$tracking_number'");
        if($result->num_rows==0){
            return -1;
        }
        $row = mysqli_fetch_array($result);

        $completed_path = $row['path_completed'];
        $first_token = strtok($row['path_remaining'],',');
        if($first_token==$transit_hub){
            $restOfPath = substr($row['path_remaining'],strlen($first_token)+1);
            if($restOfPath==""){
                $restOfPath = NULL;
                $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `path_remaining`= NULL");
            }
            else{
                $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `path_remaining`='$restOfPath'");
            }
            $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `current_hub`='$transit_hub'");
            if($completed_path==NULL){
                $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `path_completed`='$transit_hub'");
            }
            else{
                $myString = $completed_path . "," . $transit_hub;
                $result = mysqli_query($this->conn,"UPDATE `δέμα` SET `path_completed`='$myString'");
            }
            return 0;
        }
        else{
            return -1;
        }
    }

    /**
     *
     */
    public function network_of_stores(){
        $stores = new Stores($this->conn);
        return $stores->jsonSerialize();
    }

    /**
     * @param $postal_code
     * @return $closest_store
     */
    public function nearest_store_by_tk($postal_code){
        $stores = new Stores($this->conn);
        $closest_store = null;
        $coord = file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($postal_code) . '&sensor=false&components=country:GR');
        $coord = json_decode($coord);

        $curr_lat = $coord->results[0]->geometry->location->lat;
        $curr_lng = $coord->results[0]->geometry->location->lng;

        $cur_diff = 99999;
        $new_diff = 0;

        for($i = 0; $i < count($stores->stores_table); $i++){
            $new_diff = abs($stores->stores_table[$i]->lat - $curr_lat) + abs($stores->stores_table[$i]->lng-$curr_lng);
            if($new_diff < $cur_diff){
                $cur_diff = $new_diff;
                $closest_store = $stores->stores_table[$i];
            }
        }

        return $closest_store->jsonSerialize();
    }

    /**
     * @param $address
     * @return mixed
     */
    public function nearest_store_by_address($address){
        $stores = new Stores($this->conn);
        $closest_stores = array();
        $closest = null;

        $coord = file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($address) . '&sensor=false&components=country:GR');
        $coord = json_decode($coord);

        $curr_lat = $coord->results[0]->geometry->location->lat;
        $curr_lng = $coord->results[0]->geometry->location->lng;

        $cur_diff = 99999;
        $new_diff = 0;

        for($i = 0; $i < count($stores->stores_table); $i++){
            $new_diff = abs($stores->stores_table[$i]->lat - $curr_lat) + abs($stores->stores_table[$i]->lng-$curr_lng);
            if($new_diff < $cur_diff){
                $cur_diff = $new_diff;
                $closest = $stores->stores_table[$i];
            }
        }
        array_push($closest_stores,$closest);
        $cur_diff = 99999;
        $new_diff = 0;
        for($i = 0; $i < count($stores->stores_table); $i++){
            if($closest_stores[0]->id != $stores->stores_table[$i]->id){
                $new_diff = abs($stores->stores_table[$i]->lat - $curr_lat) + abs($stores->stores_table[$i]->lng-$curr_lng);
                if($new_diff < $cur_diff){
                    $cur_diff = $new_diff;
                    $closest = $stores->stores_table[$i];
                }
            }
        }
        array_push($closest_stores,$closest);

        $cur_diff = 99999;
        $new_diff = 0;
        for($i = 0; $i < count($stores->stores_table); $i++){
            if($closest_stores[0]->id != $stores->stores_table[$i]->id && $closest_stores[1]->id != $stores->stores_table[$i]->id){
                $new_diff = abs($stores->stores_table[$i]->lat - $curr_lat) + abs($stores->stores_table[$i]->lng-$curr_lng);
                if($new_diff < $cur_diff){
                    $cur_diff = $new_diff;
                    $closest = $stores->stores_table[$i];
                }
            }
        }
        array_push($closest_stores,$closest);

        $cur_diff = 99999;
        $new_diff = 0;
        for($i = 0; $i < count($stores->stores_table); $i++){
            if($closest_stores[0]->id != $stores->stores_table[$i]->id && $closest_stores[1]->id != $stores->stores_table[$i]->id && $closest_stores[2]->id != $stores->stores_table[$i]->id){
                $new_diff = abs($stores->stores_table[$i]->lat - $curr_lat) + abs($stores->stores_table[$i]->lng-$curr_lng);
                if($new_diff < $cur_diff){
                    $cur_diff = $new_diff;
                    $closest = $stores->stores_table[$i];
                }
            }
        }
        array_push($closest_stores,$closest);

        return $closest_stores;
    }

    public function get_new_store_coordinates($address){
        $coord = file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($address) . '&sensor=false&components=country:GR');
        $coord = json_decode($coord);
        $curr_lat = $coord->results[0]->geometry->location->lat;
        $curr_lng = $coord->results[0]->geometry->location->lng;

        return $curr_lat.",".$curr_lng;
    }

    /**
     * @param $city
     * @return array|null
     */
    public function nearest_store_by_city($city){
        $stores = new Stores($this->conn);
        $closest_stores = array();

        $closest_stores = $stores->closest_stores($this->conn,$city) ;

        return $closest_stores;
    }

    public function store_packages($id){
        $result = mysqli_query($this->conn,"SELECT * FROM `δέμα` WHERE `starting_store`='".$id."' OR `destination_store`='".$id."'" );
        return $result->num_rows;
    }


    /**
     * @param $id
     * @param $hub
     */
    public function delete_store($id, $hub){
        mysqli_query($this->conn,"UPDATE `transit hub` SET `stores`=`stores` - 1 WHERE `id`='".$hub."'");
        mysqli_query($this->conn,"DELETE FROM `κατάστημα` WHERE `id`='".$id."'");
    }

    /**
     * @param $store
     */
    public function create_store($store){
        mysqli_query($this->conn,"INSERT INTO `κατάστημα` (`id`,`name`,`street`,`st_number`,`city`,`TK`,`telephone`,`coordinates`,`employees`,`transit_hub`) 
																VALUES (NULL,'".$store->name."',
																'".$store->street."',
																'".$store->st_number."',
																'".$store->city."',
																'".$store->tk."',
																'".$store->telephone."',
																'".$store->coordinates."',
																'0',
																'".$store->transit_hub."')");
        mysqli_query($this->conn,"UPDATE `transit hub` SET `stores`=`stores` + 1 WHERE `id`='".$store->transit_hub."'");
    }

    /**
     * @param $store
     */
    public function edit_store($store){
        $result = mysqli_query($this->conn,"SELECT * FROM `κατάστημα` WHERE `id`='".$store->id."'");

        $row = mysqli_fetch_array($result);

        if($row['transit_hub']!=$store->transit_hub){

            $result = mysqli_query($this->conn,"UPDATE `transit hub` SET `stores` = `stores` - 1 WHERE `id`='".$row['transit_hub']."'");

            $result = mysqli_query($this->conn,"UPDATE `transit hub` SET `stores` = `stores` + 1 WHERE `id`='".$store->transit_hub."'");
        }

        $result = mysqli_query($this->conn,"UPDATE `κατάστημα` SET `name`='".$store->name."',`street`='".$store->street."',
														`st_number`='".$store->st_number."',`city`='".$store->city."',
														`TK`='".$store->tk."',`telephone`='".$store->telephone."',
														`coordinates`='".$store->coordinates."',`transit_hub`='".$store->transit_hub."' WHERE `id` = '".$store->id."'");
    }

    /**
     * @return array
     */
    public function network_of_employees(){
         $employees = new Employees($this->conn);
        return $employees->jsonSerialize();
    }

    /**
     * @param $id
     * @param $store
     */
    public function delete_store_employee($id, $store){
        mysqli_query($this->conn,"UPDATE `κατάστημα` SET `employees`=`employees` - 1 WHERE `id`='".$store."'");
        mysqli_query($this->conn,"DELETE FROM `χρήστης` WHERE `id`='".$id."'");
    }

    /**
     * @param $id
     * @param $transit_hub
     */
    public function delete_hub_employee($id, $transit_hub){
        mysqli_query($this->conn,"UPDATE `transit hub` SET `employees`=`employees` - 1 WHERE `id`='".$transit_hub."'");
        mysqli_query($this->conn,"DELETE FROM `χρήστης` WHERE `id`='".$id."'");
    }

    /**
     * @param $employee
     */
    public function create_employee($employee){
        if ($employee->transit_hub == '-1') {

            $result = mysqli_query($this->conn,"INSERT INTO `χρήστης` (`firstname`,`lastname`,`username`,`password`,`isAdmin`,`store`) VALUES ('".$employee->firstname."',
                                                                '".$employee->lastname."',
                                                                '".$employee->username."',
                                                                '".$employee->password."',
                                                                '0',
                                                                '".$employee->store."')");


            mysqli_query($this->conn,"UPDATE `κατάστημα` SET `employees`=`employees` + 1 WHERE `id`='".$employee->store."'");
        }
        else if ($employee->store == '-1') {

             mysqli_query($this->conn,"INSERT INTO `χρήστης` (`firstname`,`lastname`,`username`,`password`,`isAdmin`,`transit_hub`) VALUES ('".$employee->firstname."',
                                                                '".$employee->lastname."',
                                                                '".$employee->username."',
                                                                '".$employee->password."',
                                                                '0',
                                                                '".$employee->transit_hub."')");

             mysqli_query($this->conn,"UPDATE `transit hub` SET `employees`=`employees` + 1 WHERE `id`='".$employee->transit_hub."'");
        }
    }

    /**
     * @param $employee
     */
    public function edit_employee($employee){
        $result = mysqli_query($this->conn,"SELECT * FROM `χρήστης` WHERE `id`='".$employee->id."'");

        $row = mysqli_fetch_array($result);

        if($employee->type == 'store_empl'){
            if($row['store']!=$employee->store){
                $result = mysqli_query($this->conn,"UPDATE `κατάστημα` SET `employees` = `employees` - 1 WHERE `id`='".$row['store']."'");

                $result = mysqli_query($this->conn,"UPDATE `κατάστημα` SET `employees` = `employees` + 1 WHERE `id`='".$employee->store."'");
            }

            $result = mysqli_query($this->conn,"UPDATE `χρήστης` SET `firstname`='".$employee->firstname."',`lastname`='".$employee->lastname."',`username`='".$employee->username."',`password`='".$employee->password."',`store`='".$employee->store."' WHERE `id` = '".$employee->id."'");

        }
        else if($employee->type == 'hub_empl'){
            if($row['transit_hub']!=$employee->transit_hub){
                $result = mysqli_query($this->conn,"UPDATE `transit hub` SET `employees` = `employees` - 1 WHERE `id`='".$row['transit_hub']."'");

                $result = mysqli_query($this->conn,"UPDATE `transit hub` SET `employees` = `employees` + 1 WHERE `id`='".$employee->transit_hub."'");
            }
            $result = mysqli_query($this->conn,"UPDATE `χρήστης` SET `firstname`='".$employee->firstname."',`lastname`='".$employee->lastname."',`username`='".$employee->username."',`password`='".$employee->password."',`transit_hub`='".$employee->transit_hub."' WHERE `id` = '".$employee->id."'");
        }

    }



}



