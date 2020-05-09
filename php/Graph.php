<?php

/**
 * Created by PhpStorm.
 * User: cgkournelos
 * Date: 07-Jun-17
 * Time: 11:03 PM
 */

class HubConnection{
    public $connection_id = null;
    public $id_1 = null;
    public $id_2 = null;
    public $time = null;
    public $cost = null;

    /**
     * HubConnection constructor.
     * @param $connection_id
     * @param $id_1
     * @param $id_2
     * @param $time
     * @param $cost
     */
    public function __construct($connection_id, $id_1, $id_2, $time, $cost){
        $this->connection_id = $connection_id;
        $this->id_1 = $id_1;
        $this->id_2 = $id_2;
        $this->time = $time;
        $this->cost = $cost;
    }

}

class HubConnectionsTable{
    public $table = array();

    /**
     * HubConnectionsTable constructor.
     * @param $conn
     */
    public function __construct($conn){
        $result = mysqli_query($conn,"SELECT * FROM `hub connection`");
        if($result->num_rows > 0) {
            while ($row = mysqli_fetch_array($result)){
                array_push($this->table, new HubConnection($row['connection_id'], $row['id_1'], $row['id_2'],
                    $row['time'], $row['cost']));
            }
        }
    }

    /**
     * @param $id1
     * @param $id2
     */
    public function erase_connection($id1, $id2){
        $index = 0;
        foreach($this->table as $conn){
            if(($conn->id_1 == $id1 && $conn->id_2 == $id2) || ($conn->id_1 == $id2 && $conn->id_2 == $id1) ){
                unset($this->table[$index]);
                return;
            }
            $index++;
        }
    }
}

class Graph{

    public $cost = null;
    public $time = null;
    public $path = null;
    public $error_flag = null;

    /**
     * Graph constructor.
     * @param $conn
     * @param $method
     * @param $curr_store
     * @param $dest_store
     */
    public function __construct($conn, $method, $curr_store, $dest_store){
        $this->error_flag = false;
        $counter=0;
        $cost = null;
        $time = null;
        $path = null;
        $temp_route = null;

        $path = array();

        $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `id`='".$curr_store."'");

        $row = mysqli_fetch_array($result);

        $first_hub = $row['transit_hub'];

        $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE `id`='".$dest_store."'");

        $row = mysqli_fetch_array($result);

        $last_hub = $row['transit_hub'];

        if($first_hub == $last_hub){

            $this->cost = 2;
            $this->time = 0;
            array_push($path, $first_hub);
            $this->path = $path;
            return;
        }

        while(1){
            $counter++;
            $_distArr = array();

            if($counter == 1){
                $dbtable = "hub connection";
                $result = mysqli_query($conn,"SELECT * FROM `".$dbtable."`");
                $count = mysqli_num_rows($result);
                if($count==0){
                    $this->error_flag = true;
                    return;
                }
                else{
                    while($row = mysqli_fetch_array($result)){

                        if($method=='express'){
                            $_distArr[$row['id_1']][$row['id_2']] = $row['time'];
                            $_distArr[$row['id_2']][$row['id_1']] = $row['time'];
                        }else if($method=='standard'){
                            $_distArr[$row['id_1']][$row['id_2']] = $row['cost'];
                            $_distArr[$row['id_2']][$row['id_1']] = $row['cost'];
                        }
                    }
                }
            }
            else {
                foreach ($temp_route->table as $connection){
                    if($method=='express'){
                        $_distArr[$connection->id_1][$connection->id_2] = $connection->time;
                        $_distArr[$connection->id_2][$connection->id_1] = $connection->time;
                    }else if($method=='standard'){
                        $_distArr[$connection->id_1][$connection->id_2] = $connection->cost;
                        $_distArr[$connection->id_2][$connection->id_1] = $connection->cost;
                    }
                }
            }

            $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE id='$curr_store'");
            $row = mysqli_fetch_array($result);
            $start = $row['transit_hub'];

            $result = mysqli_query($conn,"SELECT * FROM `κατάστημα` WHERE id='$dest_store'");
            $row = mysqli_fetch_array($result);
            $end = $row['transit_hub'];

            $a = $start;
            $b = $end;



            //initialize the array for storing
            $S = array();//the nearest path with its parent and weight
            $Q = array();//the left nodes without the nearest path
            foreach(array_keys($_distArr) as $val) $Q[$val] = 99999;
            $Q[$a] = 0;

            //start calculating
            while(!empty($Q)){
                $min = array_search(min($Q), $Q);//the most min weight
                if($min == $b) break;
                foreach($_distArr[$min] as $key=>$val) if(!empty($Q[$key]) && $Q[$min] + $val < $Q[$key]) {
                    $Q[$key] = $Q[$min] + $val;
                    $S[$key] = array($min, $Q[$key]);
                }
                unset($Q[$min]);
            }

            //list the path
            $path = array();
            $pos = $b;

            //No way found
            if (!array_key_exists($b, $S)) {
                //echo "Found no way.";
                if($this->cost != null){       // either this or delete first connection of the path. Have to decide later what to do about this.
                    break;
                }
                $this->error_flag = true;
                return;
            }

            while($pos != $a){
                $path[] = $pos;
                $pos = $S[$pos][0];
            }

            $path[] = $a;
            $path = array_reverse($path);

            $cost = 0;
            $time = 0;

            $pathLength = count($path);

            if($method =='express'){
                for($i=0;$i<$pathLength;$i++){
                    $k = $i + 1;
                    $result = mysqli_query($conn,"SELECT * FROM `hub connection` WHERE (`id_1`='$path[$i]' AND `id_2`='$path[$k]') OR (`id_1`='$path[$k]' AND `id_2`='$path[$i]')");

                    $row = mysqli_fetch_array($result);

                    $cost+=$row['cost'];

                    if($path[$k]==$end){
                        break;
                    }
                }
                $time = $S[$b][1];
            }
            else if($method=='standard'){
                for($i=0;$i<$pathLength;$i++){
                    $k = $i + 1;
                    $result = mysqli_query($conn,"SELECT * FROM `hub connection` WHERE (`id_1`='$path[$i]' AND `id_2`='$path[$k]') 
											OR (`id_1`='$path[$k]' AND `id_2`='$path[$i]')");

                    $row = mysqli_fetch_array($result);

                    $time+=$row['time'];

                    if($path[$k]==$end){
                        break;
                    }
                }
                $cost = $S[$b][1];
            }

            $id_1 = $path[$pathLength-2];
            //$id_1 = $path[0];
            $id_2 = $path[$pathLength-1];
            //$id_2 = $path[1];

            if($counter==1){

                $this->cost = $cost;
                $this->time = $time;
                $this->path = $path;
                if( count($this->path) <= 2 ){
                    break;
                }
                $temp_route = new HubConnectionsTable($conn);
                $temp_route->erase_connection($id_1, $id_2);
            }
            else{
                if($method=='standard'){
                    if($cost==$this->cost){

                        if($time < $this->time){
                            $this->path = $path;
                            $this->time = $time;
                        }
                        $temp_route->erase_connection($id_1, $id_2);

                    }
                    else{
                        break;
                    }
                }
                else if($method=='express'){
                    if($time==$this->time){
                        if($cost < $this->cost){
                            $this->path = $path;
                            $this->cost = $cost;
                        }
                        $temp_route->erase_connection($id_1, $id_2);
                    }
                    else{
                        break;
                    }
                }
            }

            unset($path);
            unset($_distArr);
            unset($S);
            unset($Q);
        }

        $this->cost += 2 ;
        return;
       // $pathString = "" . implode(',',$this->path);
    }

    public function jsonSerialize(){
        $vars = get_object_vars($this);
        return $vars;
    }
}