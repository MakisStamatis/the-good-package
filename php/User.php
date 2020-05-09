<?php

/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 24-May-17
 * Time: 1:27 PM
 *
 * @brief This class defines the object Employee for stores, hubs or admins
 */
class User{

    public $username = null;
    public $firstname = null;
    public $lastname = null;
    public $type = null;
    //public $id = null;
    public $store = null;
    public $storeName = null; /*!< This var is store_id for store empl and hub_id for hub empl*/

    public function __construct($username, $password,$conn){
        $query = "SELECT * FROM χρήστης WHERE username= '".$username."' and password= '".$password."'";

        $result = mysqli_query($conn,$query);

        if($result->num_rows > 0){
            $row = $result->fetch_assoc();

            $this->username = $row['username'];
            $this->firstname = $row['firstname'];
            $this->lastname = $row['lastname'];
            $isAdmin = $row['isAdmin'];
            $transit_hub = $row['transit_hub'];

            if($isAdmin != '0'){
                $this->type = 'admin';
            }
            else{
                if($transit_hub != ''){
                    $this->type = "hub_empl";
                    $this->store = $row['transit_hub'];
                    $result = mysqli_query($conn,"SELECT * FROM `transit hub` WHERE `id` = ". $this->store ."");

                    $row = mysqli_fetch_array($result);

                    $this->storeName = $row['area'];

                }
                else{
                    $this->type = "store_empl";
                    $this->store = $row['store'];

                    $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `id` = ". $this->store ."");

                    $row = mysqli_fetch_array($result);

                    $this->storeName = $row['street'] . " " . $row['st_number'] . " , " . $row['city'] . " " . $row['TK'];
                }
            }
        }
        else{
            $this->username = '';
        }
    }



    public function jsonSerialize(){
        $vars = get_object_vars($this);

        return $vars;
    }

}