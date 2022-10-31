
$(function () {
    var api = "getSingle";
    var item = {};
    var format = "image/png";
    var map;
    var mapLat = 21.006423;
    var mapLng = 105.841394;
    var mapDefaultZoom = 14;
    const toastSuccess = new bootstrap.Toast(document.getElementById('success'))
    const toastError = new bootstrap.Toast(document.getElementById('error'))
    toggleReadonly(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapLat = pos.coords.latitude;
          mapLng = pos.coords.longitude;
          initialize_map(true);
        }
      );
    }
    else initialize_map(false);
  
    function initialize_map(isPos) {
      layerBG = new ol.layer.Tile({
        className: "osm-layer",
        source: new ol.source.OSM({}),
      });
      var layer_bg = new ol.layer.Image({
        className: "bg-layer",
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: "http://localhost:8080/geoserver/example/wms",
          params: {
            FORMAT: format,
            VERSION: "1.1.0",
            STYLES: "",
            LAYERS: "example:danhgioihn",
          },
        }),
      });
      var layer_ic = new ol.layer.Image({
        className: "point-layer",
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: "http://localhost:8080/geoserver/example/wms",
          params: {
            FORMAT: format,
            VERSION: "1.1.0",
            STYLES: "",
            LAYERS: "example:pointfl",
          },
        }),
      });
      var viewMap = new ol.View({
        center: ol.proj.fromLonLat([mapLng, mapLat]),
        zoom: mapDefaultZoom,
      });
      map = new ol.Map({
        target: "map",
        layers: [layerBG, layer_bg, layer_ic],
        view: viewMap,
      });
  
      if (isPos) {
        const positionFeature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.transform([mapLng, mapLat], "EPSG:4326", "EPSG:3857")
          ),
        });
        positionFeature.setStyle(
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 6,
              fill: new ol.style.Fill({
                color: "#3399CC",
              }),
              stroke: new ol.style.Stroke({
                color: "#fff",
                width: 2,
              }),
            }),
          })
        );
  
        new ol.layer.Vector({
          map: map,
          source: new ol.source.Vector({
            features: [positionFeature],
          }),
        });
      }
  
      map.on("click", function (evt) {
        var zoom = map.getView().getZoom();
        var coord = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
        var point = "POINT(" + coord[0] + " " + coord[1] + ")";
        if (api == "getSingle") {
          callAPI(api, point, zoom, item).then((res) => {
            if(res){
              setItem(res);
              openAside();
            }
            else
            closeAside();
          });
        } else {
          callAPI('isInHN', point, zoom, item).then(res => {
            if(res){
              return callAPI('getSingle', point, zoom, item);
            }
            closeAside();
          }).then(res => {
            if((api == 'edit' && res)){
              item = res;
              toggleReadonly(false);
              setItem(res);
              openAside();
            }
            else if (api == 'add' && !res){
              item = {}
              toggleReadonly(false);
              setItem(item);
              item.geom = point;
              openAside();
            }
            else if(api == 'delete' && res)
              callAPI(api, point, zoom, res).then(res => {
                if(res){
                toastSuccess.show()
                layer_ic.getSource().changed();
                }
                toastError.show();
              });
            else
              closeAside();
          })
        }
        layer_ic.getSource().changed();
      });
  
      $('#save').click(function () { 
          item = getItem();
          callAPI(api, null, 0, item).then((res) => {
            res ? toastSuccess.show() : toastError.show();
            layer_ic.getSource().changed();
          });
      });
      $(".show").on("click", function () {
        callAPI("listAll",null,0,null).then(function(res) {
            let htmlStr = "";
            res.forEach(row => {
                htmlStr += `<tr class="tb-item">
                <td data-gid="`+row.gid+`"><strong>`+row.name+`</strong></td>
                <td  data-gid="`+row.gid+`">`+row.addr_stree+`</td>
            </tr>`
            });
            $('#infAll').html(htmlStr);

            $('.tb-item').on('click', 'td',(e) =>{
              let gid = $(e.target).data('gid');
              $.ajax({
                type: "POST",
                url: "pgsqlAPI.php",
                data: {
                  function: "getByID",
                  gid: gid,
                },
                success: function (result) {
                  item = JSON.parse(result);
                  setItem(item);
                  let lng = parseFloat(item.lng),
                  lat = parseFloat(item.lat);
                  map.getView()
                    .fit(new ol.geom.Point(
                        ol.proj.transform([lng, lat],"EPSG:4326","EPSG:3857"
                      )),
                      {
                        maxZoom : 16
                      }
                    );
                  $(".md_overlay, .pop_up").removeClass( "active" );
                  openAside();
                },
              });
            })
        })
        $(".md_overlay, .pop_up").addClass( "active" );
    });
    $(".md_close").on("click", function () {
        $(".md_overlay, .pop_up").removeClass( "active" );
    });
    $("#submit").on("click", function () {
        $(".md_overlay, .pop_up").removeClass( "active" );
    });
    $(".form_pop_up table tbody tr").on("click", function () {
        $(".md_overlay, .pop_up").removeClass( "active" );
    });
      $('#cancel').click(() => {
        closeAside();
      })
  
      function callAPI(api, point, distance, item) {
        return new Promise((resolve, reject) => {
          $.ajax({
            type: "POST",
            url: "pgsqlAPI.php",
            data: {
              function: api,
              point: point,
              distance: distance,
              item: item,
            },
            success: function (result) {
              resolve(JSON.parse(result));
            },
            error: function (req, status, error) {
              reject(req + " " + status + " " + error);
            },
          });
        });
      }
    }
  
    $(".fe_rt").click(function (e) {
      $(".exit-btn").hide();
      $(".aside").hide();
      $(".fe_rt").removeClass("selected");
      $(this).addClass("selected");
      api = $(this).data("api");
      if (api === "add" || api === "edit") {
        toggleReadonly(false);
      }
      toggleReadonly(true);
    });
  
    $(".exit-btn").click(function (e) {
      closeAside();
    });
  
    function openAside() {
      $(".exit-btn").show();
      $(".aside").show();
    }
    function closeAside() {
      $("#deafault").click();
      $(".exit-btn").hide();
      $(".aside").hide();
      item = {};
      setItem(item);
      toggleReadonly(true);
    }
  
    function setItem(item) {
      $("#name").val(item.name);
      $("#addr").val(item.addr_stree);
    }
  
    function getItem() {
      item.name = $("#name").val();
      item.addr_stree = $("#addr").val();
      return item;
    }
    function toggleReadonly(isReadonly) {
      $("#name").prop("readonly", isReadonly);
      $("#addr").prop("readonly", isReadonly);
      if(!isReadonly){
        $('#save').show();
        $('#cancel').show();
      }
      else{
        $('#save').hide();
        $('#cancel').hide();
      }
    }
  });
  