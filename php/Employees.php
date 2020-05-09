<?php

/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 06-Jun-17
 * Time: 10:13 PM
 */
class Employee{
    public $id = null;
    public $firstname = null;
    public $lastname = null;
    public $username = null;
    public $type = null;
    public $transit_hub = null;
    public $store = null;
    public $store_name = null;

    /**
     * Employee constructor.
     * @param $id
     * @param $firstname
     * @param $lastname
     * @param $username
     * @param $password
     * @param $isAdmin
     * @param $transit_hub
     * @param $store
     */
    public function __construct($conn, $id, $firstname, $lastname, $username, $password, $isAdmin, $transit_hub, $store){
        $this->id = $id;
        $this->firstname = $firstname;
        $this->lastname = $lastname;
        $this->username = $username;
        $this->password = $password;
        $this->transit_hub = $transit_hub;
        $this->store = $store;

        if($isAdmin != '0'){
            $this->type = 'admin';
        }
        else{
            if($transit_hub != ''){
                $this->type = "hub_empl";
                $storeNameResult = mysqli_query($conn,"SELECT * FROM `transit hub` WHERE `id`='".$transit_hub."'");
                $storeRow = mysqli_fetch_array($storeNameResult);
                $this->store_name = $storeRow['area'];
            }
            else{
                $this->type = "store_empl";
                $storeNameResult = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `id`='".$store."'");
                $storeRow = mysqli_fetch_array($storeNameResult);
                $this->store_name = $storeRow['name'];
            }
        }
    }

    /**
     * @return array
     */
    public function jsonSerialize(){
        $vars = get_object_vars($this);
        return $vars;
    }
}

class Employees{
    public $employees_table = array();
    public $stores_employees = array();
    public $hubs_employees = array();

    /**
     * Employees constructor.
     * @param $conn
     */
    public function __construct($conn){
        $result = mysqli_query($conn,"SELECT * FROM `χρήστης`");
        if($result->num_rows > 0) {
            while ($row = mysqli_fetch_array($result)) {
                array_push($this->employees_table, new Employee( $conn, $row['id'], $row['firstname'], $row['lastname'], $row['username'],
                    $row['password'], $row['isAdmin'], $row['transit_hub'], $row['store']));
            }
        }

        for($i = 0; $i<count($this->employees_table); $i++){
            if($this->employees_table[$i]->type =="hub_empl" ){
                array_push($this->hubs_employees,$this->employees_table[$i]);
            }
            else if($this->employees_table[$i]->type =="store_empl"){
                array_push($this->stores_employees,$this->employees_table[$i]);
            }
        }
    }

    /**
     * @return array
     */
    public function jsonSerialize(){
        $vars = get_object_vars($this);
        return $vars;
    }
}