<?php

/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 24-May-17
 * Time: 8:29 PM
 */
class Store{

    public $id = null;
    public $name = null;
    public $coordinates =  null;
    public $lat =  null;
    public $lng =  null;
    public $telephone = null;
    public $street = null;
    public $st_number = null;
    public $city = null;
    public $tk = null;
    public $physical_address = null;
    public $employees = null;
    public $transit_hub = null;

    /**
     * Store constructor.
     * @param $id
     * @param $name
     * @param $coor
     * @param $tel
     * @param $str
     * @param $st_num
     * @param $city
     * @param $tk
     * @param $empl
     * @param $hub
     */
    public function __construct($id, $name, $coor, $tel, $str, $st_num, $city,
                                $tk, $empl, $hub){
        $this->id = $id;
        $this->name = $name;
        $this->coordinates = $coor;
        $temp = explode(",",$coor);
        $this->lat = $temp[0];
        $this->lng = $temp[1];
        $this->telephone = $tel;
        $this->street = $str;
        $this->st_number = $st_num;
        $this->city = $city;
        $this->tk = $tk;
        $this->physical_address = $this->street . " " . $this->st_number . " , " . $this->city . " " . $this->tk;
        $this->employees = $empl;
        $this->transit_hub = $hub;
    }

    /**
     * @return array
     */
    public function jsonSerialize(){
        $vars = get_object_vars($this);

        return $vars;
    }

}

class Hub{

    public $id = null;
    public $area = null;
    public $coordinates = null;
    public $stores = null;
    public $employees = null;

    /**
     * Hubs constructor.
     * @param $id
     * @param $area
     * @param $coor
     * @param $stores
     * @param $empl
     */
    public function __construct($id, $area, $coor, $stores, $empl){
        $this->id = $id;
        $this->area = $area;
        $this->coordinates = $coor;
        $this->stores = $stores;
        $this->employees = $empl;
    }

    /**
     * @return array
     */
    public function jsonSerialize(){
        $vars = get_object_vars($this);

        return $vars;
    }

}

class Stores{

    public $stores_table = array();
    public $hubs_table = array();
    public $success = null;

    /**
     * Stores constructor.
     * @param $conn
     */
    public function __construct($conn){
        $result = mysqli_query($conn,"SELECT * FROM `κατάστημα`");
        if($result->num_rows > 0) {
            while ($row = mysqli_fetch_array($result)){
                array_push($this->stores_table, new Store($row['id'], $row['name'], $row['coordinates'], $row['telephone'],
                   $row['street'], $row['st_number'], $row['city'], $row['TK'], $row['employees'], $row['transit_hub']));
            }
            $this->success = true;
        }
        else{
//            $this->success = false;
//            return;
        }


        $result = mysqli_query($conn,"SELECT * FROM `transit hub`");
        if($result->num_rows > 0) {
            while ($row = mysqli_fetch_array($result)){
                array_push($this->hubs_table, new Hub($row['id'], $row['area'], $row['coordinates'], $row['stores'], $row['employees']));
            }
            $this->success = true;
        }
        else{
//            $this->success = false;
//            return;
        }
    }

    /**
     * @param $conn
     * @param $city
     * @return array|int
     */
    public function closest_stores($conn, $city){
        $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `city` LIKE '%$city%'");
        $closest_stores = array();
        if($result->num_rows > 0) {
            while ($row = mysqli_fetch_array($result)){
                array_push($closest_stores, new Store($row['id'], $row['name'], $row['coordinates'], $row['telephone'],
                    $row['street'], $row['st_number'], $row['city'], $row['TK'], $row['employees'], $row['transit_hub']));
            }
            return $closest_stores;
        }
        else{
            return -1;
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