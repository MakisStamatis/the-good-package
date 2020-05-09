<?php

/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 22-May-17
 * Time: 8:39 PM
 */


class Package{
    public $path = null;
    public $current_hub = null;
    public $tracking_number = null;
    public $readable_path = null;
    public $id = null;
    public $area = null;
    public $coordinates = null;
    public $starting_store = null;
    public $destination_store = null;
    public $delivered = null;

    public function __construct($trk,$conn){

        $this->tracking_number = $trk;

        $result = mysqli_query($conn,"SELECT * FROM `δέμα` WHERE `tracking_number`='$this->tracking_number'");
        if($result->num_rows > 0) {
            $row = mysqli_fetch_array($result);
            $this->path = $row['path_completed'];
            $this->current_hub = $row['current_hub'];
            $this->starting_store = $row['starting_store'];
            $this->destination_store = $row['destination_store'];
            $this->delivered = $row['delivered'];

            $result = mysqli_query($conn,"SELECT * FROM `transit hub` WHERE `id`='$this->current_hub'");
            if($result->num_rows > 0) {
                $row = mysqli_fetch_array($result);

                $this->id = $row['id'];
                $this->area = "Transit Hub:" . $row['area'];
                $this->coordinates = $row['coordinates'];

                $this->readable_path = "";

                $token = strtok($this->path, ",");
                $counter = 0;
                while ($token !== false) {
                    $result = mysqli_query($conn, "SELECT `area` FROM `transit hub` WHERE `id`='$token'");
                    $row = mysqli_fetch_array($result);
                    if ($counter == 0) {
                        $this->readable_path .= $row['area'];
                    }
                    else {
                        $this->readable_path .= ", " . $row['area'];
                    }
                    $token = strtok(",");
                    $counter++;
                }

                if($this->readable_path == ""){
                    $this->readable_path = "Αρχικό κατάστημα, " . $row['area'];
                }
            }
            else{
                $this->current_hub =  null;
                $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `id`='$this->starting_store'");
                $row = mysqli_fetch_array($result);

                $this->area = $row['street'] . " " . $row['st_number'] . " , " . $row['city'] . " " . $row['TK'];
                $this->coordinates = $row['coordinates'];
                $this->readable_path = "Το δέμα σας βρίσκεται στο αρχικό κατάστημα";
            }
        }
        else{
            $this->coordinates = -1;
        }
    }

    public function jsonSerialize(){
        $vars = get_object_vars($this);

        return $vars;
    }
}