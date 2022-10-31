<?php

use function PHPSTORM_META\type;

$SRID = '4326';
if (isset($_POST['function'])) {
    $paPDO = initDB();
    if(isset($_POST['point']))
        $paPoint = $_POST['point'];
    if(isset($_POST['distance']))
        $distance = $_POST['distance']*= 0.0005;
    if(isset($_POST['keyword']))
        $keyword = strtolower($_POST['keyword']);
    if(isset($_POST['gid']))
        $gid = strtolower($_POST['gid']);
    $function = $_POST['function'];

    $aResult = "null";
    if ($function == 'getSingle')
        $aResult = getSingle($paPDO, $paPoint, $distance);
    else if($function == 'listAll')
        $aResult = listAll($paPDO, $paPoint, $keyword);
    else if($function == 'add')
        $aResult = add($paPDO, $_POST['item']);
    else if($function == 'edit')
        $aResult = edit($paPDO, $_POST['item']);
    else if($function == 'delete')
        $aResult = delete($paPDO, $_POST['item']);
    else if($function == 'isInHN')
        $aResult = isInHN($paPDO, $paPoint);
    else if($function == 'getByID')
        $aResult = getByID($paPDO, $gid);
    echo $aResult;

    closeDB($paPDO);
}
function initDB()
{
    // Kết nối CSDL
    $paPDO = new PDO('pgsql:host=localhost;dbname=TestCSDL;port=5432', 'postgres', 'Phu19032001');
    return $paPDO;
}
function query($paPDO, $paSQLStr)
{
    try {
        // Khai báo exception
        $paPDO->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Sử đụng Prepare 
        $stmt = $paPDO->prepare($paSQLStr);
        // Thực thi câu truy vấn
        $stmt->execute();

        // Khai báo fetch kiểu mảng kết hợp
        $stmt->setFetchMode(PDO::FETCH_ASSOC);

        // Lấy danh sách kết quả
        $paResult = $stmt->fetchAll();
        return $paResult;
    } catch (PDOException $e) {
        echo "Thất bại, Lỗi: " . $e->getMessage();
        return null;
    }
}

function closeDB($paPDO)
{
    // Ngắt kết nối
    $paPDO = null;
}

function isInHN($pdo, $point)
{
    global $SRID;
    $mySQLStr = "select st_contains(geom, ST_GeometryFromText('$point', $SRID)) as res from danhgioihn";
    $result = query($pdo, $mySQLStr);
    if ($result != null) {
        return $result[0]['res'];
    }
    return false;
}

function getSingle($pdo,$point, $distance)
{
    global $SRID;
    $mySQLStr = "select * from pointfl where st_contains(ST_Buffer(geom, $distance), ST_GeometryFromText('$point', $SRID));";
    $result = query($pdo, $mySQLStr);
    if ($result != null) {
        return json_encode($result[0]);
    }
    return 'null';
}

function listAll($pdo,$point,$keyword){
    global $SRID;
    $mySQLStr = "select * from pointfl ";
    $result = query($pdo, $mySQLStr);
    if ($result != null) {
        return json_encode($result);
    }
    return 'null';
}
function add($pdo, $item){
    $mySQLStr = "INSERT INTO pointfl(\"name\",addr_stree,geom) 
                 VALUES ('".$item['name']."', '".$item['addr_stree']."','".$item['geom']."');";
    $result = query($pdo, $mySQLStr);
    if ($result) {
        return true;
    }
    return false;
}

function edit($pdo, $item){
    $mySQLStr = "UPDATE pointfl SET name = '".$item['name']."', addr_stree = '".$item['addr_stree']."'
                 WHERE gid = ".$item['gid'].";";
    $result = query($pdo, $mySQLStr);
    if ($result) {
        return true;
    }
    return false;
}

function delete($pdo, $item){
    $mySQLStr = "DELETE FROM pointfl WHERE gid = ".$item['gid'].";";
    $result = query($pdo, $mySQLStr);
    if ($result) {
        return true;
    }
    return false;
}
function getByID($pdo, $gid){
    $mySQLStr = "SELECT *,ST_X(ST_Transform (geom, 4326)) AS lng, ST_Y(ST_Transform (geom, 4326)) AS lat FROM pointfl WHERE gid = ".$gid.";";
    $result = query($pdo, $mySQLStr);
    if ($result) {
        return json_encode($result[0]);;
    }
    return false;
}