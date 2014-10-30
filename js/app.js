(function(){
    //initiate the client
    var oh = Ohmage("/app", "campaign-manager")

    //attach global callbacks
    oh.callback("done", function(x, status, req){
        //for debugging only
        console.log(x);
    })

    //global error handler. In ohmage 200 means unauthenticated
    oh.callback("error", function(msg, code, req){
        (code == 200) ? window.location.replace("../web/#login") : message("<strong>Error! </strong>" + msg);
    });

    //prevent timeout
    oh.keepalive();

    //get data
    oh.user.whoami().done(function(username){
        oh.campaign.readall().done(function(data){
            $("#progressdiv").removeClass("hidden");
            var urns = Object.keys(data);
            var progress = 0;
            var total = 0;
            var requests = $.map(urns.sort(), function(urn, i){
                var roles = data[urn]["user_roles"];
                if($.inArray("author", roles) > -1 || $.inArray("supervisor", roles) > -1) {

                    var count = -1;
                    total++;

                    var tr = $("<tr>").appendTo("#campaigntablebody")
                    var td1 = $("<td>").appendTo(tr).text(data[urn].name);
                    var td2 = $("<td>").appendTo(tr).text(data[urn].creation_timestamp);
                    var td3 = $("<td>").appendTo(tr).text(data[urn].running_state);
                    var td4 = $("<td>").appendTo(tr);
                    var td5 = $("<td>").appendTo(tr);

                    var btn = $("<div />").addClass("btn-group").append('\
                        <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"> \
                        <span class="glyphicon glyphicon glyphicon-folder-open"></span></button>').appendTo(td5);

                    var ul = $("<ul />").addClass("dropdown-menu").attr("role", "menu").appendTo(btn);
                    var a1 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-th-list"></span> Edit Surveys').attr("href", "#").click(function(e){
                        e.preventDefault();
                        if(count < 0){
                            message("Loading campaign info, please be patient.", "info")
                        } else if(count > 0){
                            message("Campaign <strong>" + urn + "</strong> has existing responses and can therefore not be modified.")
                        } else {
                            message("Placeholder for updating campaign.", "info")
                        }
                    });

                    var a2 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-cog"></span> Change State').attr("href", "#").click(function(e){
                        message("Placeholder for update status", "success")
                    });

                    var a3 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-picture"></span> Visualize').attr("href", "#").click(function(e){
                        e.preventDefault();
                        if(count < 0){
                            message("Loading campaign info, please be patient.", "info")
                        } else if(count === 0){
                            message("Campaign <b>" + urn + "</b> has no existing responses. Nothing to visualize.")
                        } else {
                            window.location.href = '../dashboard/#' + urn;
                        }
                    });

                    var a4 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-floppy-save"></span> Download XML').attr("href", "#").click(function(e){
                        e.preventDefault();
                        $("#hiddenurn").val(urn)
                        $("#hiddenform").submit()
                    });

                    var a5 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-file"></span> Export Data')
                        .attr("href", "../../app/survey_response/read?campaign_urn=" + urn + "&privacy_state=shared&client=manager&user_list=urn:ohmage:special:all&prompt_id_list=urn:ohmage:special:all&output_format=csv&sort_oder=timestamp&column_list=urn:ohmage:user:id,urn:ohmage:context:timestamp,urn:ohmage:prompt:response,urn:ohmage:context:location:latitude,urn:ohmage:context:location:longitude&suppress_metadata=true")

                    return oh.survey.count(urn).done(function(counts){
                        if(!Object.keys(counts).length){
                            //no existing responses found
                            count = 0;
                        } else {
                            count = $.map(counts, function(val, key) {
                                return val[0].count;
                            }).reduce(function(previousValue, currentValue) {
                                return previousValue + currentValue;
                            });
                        }
                        td4.text(count);
                    }).always(function(){
                        var pct = (progress++/total) * 100;
                        $(".progress-bar").attr("aria-valuenow", pct).css("width", + pct + "%");
                        console.log("pct:" + pct)
                    });
                }
            });
            //data tables widget
            function initTable(){
                $('#campaigntable').dataTable( {
                    "dom" : '<"pull-right"l><"pull-left"f>tip',
                    "lengthMenu": [[25, 50, 100, -1], [25, 50, 100, "All"]],
                    "aoColumnDefs": [
                       { 'bSortable': false, 'aTargets': [ 4 ] }
                    ]
                });
            }

            //init temporary datatable
            initTable()

            //reinit final datatable after counts have been updated
            $.when.apply($, requests).always(function() {
                $("#progressdiv").addClass("hidden");
                $('#campaigntable').dataTable().fnDestroy();
                initTable();
            });
        });
    });

    function message(msg, type){
        // type must be one of success, info, warning, danger
        type = type || "danger"
        $("#errordiv").empty().append('<div class="alert alert-' + type + '"><a href="#" class="close" data-dismiss="alert">&times;</a>' + msg + '</div>');
    }
})();
