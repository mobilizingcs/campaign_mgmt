(function(){
    //initiate the client
    var oh = Ohmage("/app", "campaign-manager")

    //debugging
    window.oh = oh;

    //global data table
    var table;    

    //attach global callbacks
    oh.callback("done", function(x, status, req){
        //for debugging only
        //console.log(x);
    })

    //global error handler. In ohmage 200 means unauthenticated
    oh.callback("error", function(msg, code, req){
        (code == 200) ? window.location.replace("/#login") : message("<strong>Error! </strong>" + msg);
    });

    //prevent timeout
    oh.keepalive();

    //get data
    oh.user.whoami().done(function(username){
        updateProgress(10)
        oh.campaign.readall().done(function(data){
            updateProgress(15)
            $("#progressdiv").removeClass("hidden");
            var urns = Object.keys(data);
            var progress = 0;
            var total = 0;
            var requests = $.map(urns.sort(), function(urn, i){
                data[urn].urn = urn;
                var roles = data[urn]["user_roles"];

                //if(roles.length == 0) return;

                var count = -1;
                total++;

                var tr = $("<tr>").appendTo("#campaigntablebody").data("campaigndata", data[urn]);
                var td1 = $("<td>").appendTo(tr).text(data[urn].name);
                var td2 = $("<td>").appendTo(tr).text(data[urn].creation_timestamp);
                var td3 = $("<td>").appendTo(tr).text(data[urn].running_state);
                var td4 = $("<td>").appendTo(tr);
                var td5 = $("<td>").addClass("buttontd").appendTo(tr);

                var btn = $("<div />").addClass("btn-group").append('\
                    <button type="button" class="btn btn-default btn-sm" data-toggle="dropdown"> \
                    <span class="caret"></span></button>').appendTo(td5);

                var ul = $("<ul />").addClass("dropdown-menu").attr("role", "menu").appendTo(btn);

                var a2 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-th-list"></span> Edit Campaign').attr("href", '../surveytool/#' + urn).click(function(e){
                    if(count < 0){
                        e.preventDefault();
                        message("Loading campaign info, please be patient.", "info")
                    } else if($.inArray("author", roles) < 0 && $.inArray("supervisor", roles) < 0) {
                        e.preventDefault()
                        message("You do not have permission to modify campaign <strong>" + urn + "</strong>.")
                    } else if(count > 0){
                        e.preventDefault();
                        message("Campaign <strong>" + urn + "</strong> has existing responses and can therefore not be modified.")
                    }
                });

                var a4 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-floppy-save"></span> Download XML').attr("href", "#").click(function(e){
                    e.preventDefault();
                    $("#hiddenurn").val(urn)
                    $("#hiddenform").submit()
                });

                ul.append($("<li >").addClass('divider')) 

                var responselink = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-share"></span> Responses').attr("href", "/#" + encodeURIComponent('responsetool/#' + urn)).attr("target", "_blank").click(function(e){
                    if(count < 0){
                        e.preventDefault();
                        message("Loading campaign info, please be patient.", "info")
                    } else if(count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses.")
                    }
                });  

                var a3 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-picture"></span> Visualize').attr("href", '../dashboard/#' + urn).click(function(e){
                    if(count < 0){
                        e.preventDefault();
                        message("Loading campaign info, please be patient.", "info")
                    } else if(count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses. Nothing to visualize.")
                    }
                });

                var a7 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-blackboard"></span> Plot').attr("href", '../plotapp/#' + urn).click(function(e){
                    if(count < 0){
                        e.preventDefault();
                        message("Loading campaign info, please be patient.", "info")
                    } else if(count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses. Nothing to plot.")
                    }
                });                

                var a5 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-file"></span> Export Data')
                    .attr("href", "../../app/survey_response/read?campaign_urn=" + urn + "&privacy_state=shared&client=manager&user_list=urn:ohmage:special:all&prompt_id_list=urn:ohmage:special:all&output_format=csv&sort_oder=timestamp&column_list=urn:ohmage:user:id,urn:ohmage:context:timestamp,urn:ohmage:prompt:response,urn:ohmage:context:location:latitude,urn:ohmage:context:location:longitude&suppress_metadata=true")

                ul.append($("<li >").addClass('divider'));

                var a6 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-eye-open"></span> Monitor').attr("href", "../monitor/#" + urn);


                var a1 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-cog"></span> Settings').attr("href", "#").click(function(e){
                    e.preventDefault();
                    populateModal();
                });

                //add a default action
                var defaultbtn = $('<button type="button" class="btn btn-default btn-sm" />').html(a3.html()).click(function(e){
                    a3[0].click();
                }).prependTo(btn);

                function populateModal(){
                    oh.campaign.readall({
                        campaign_urn_list : urn,
                        output_format:"long"
                    }).done(function(x){
                        var longdata = x[urn];
                        $("#campaign_name").val(longdata.name);
                        $("#campaign_description").val(longdata.description);
                        $("#campaign_urn").val(urn);

                        //$("#campaign_running")[0].checked = (data["running_state"] == "running");
                        //$("#campaign_privacy")[0].checked = (data["privacy_state"] == "shared");

                        $("#campaign_running").bootstrapSwitch({size: "small", onColor: "success", offColor: "danger", onText:"running", offText:"stopped"})
                        $("#campaign_privacy").bootstrapSwitch({size: "small", onColor: "success", offColor: "danger", onText:"enabled", offText:"disabled"})
                        $("#campaign_privacy").bootstrapSwitch("state", longdata["privacy_state"] == "shared");
                        $("#campaign_running").bootstrapSwitch("state", longdata["running_state"] == "running");

                        $("#campaign_class option").each(function(i){
                            $(this).prop("selected", $.inArray($(this).attr("value"), longdata.classes) > -1);
                        });
                        $("#campaign_class").trigger("chosen:updated");

                        if(count){
                            $(".xml-upload-form").hide();
                        }

                        $('#myModal').modal("show").on("shown.bs.modal", function(){
                            $("#campaign_class").chosen({search_contains:true, no_results_text: "Class not found."});
                            $(".xml-upload-form").fileinput();
                        });

                        var xmldata;
                        $("input.xml-file-input").on("change", function(){
                            var f = this.files[0];
                            if(f){
                                var r = new FileReader();
                                r.onload = function(e) {
                                    xmldata = r.result;
                                }
                                r.readAsText(f);
                            } else {
                                xmldata = null;
                            }
                        })

                        $("#campaign_delete_button").unbind("click").click(function(e){
                            e.preventDefault();

                            // test for existing responses
                            if(count && !confirm("This campaign has " + count + " responses. Are you sure?")){
                                return;
                            }

                            var btn = $(this).attr("disabled", "disabled");
                            oh.campaign.delete({campaign_urn:urn}).done(function(){
                                $('#myModal').modal("hide");
                                tr.hide("slow", function(){
                                    alert("Campaign " + urn + " deleted!")
                                });
                            }).always(function(){
                                btn.removeAttr("disabled");
                            });
                        });

                        $("#campaign_save_button").unbind("click").click(function(e){
                            e.preventDefault();
                            var btn = $(this).attr("disabled", "disabled");
                            var running_state = $("#campaign_running")[0].checked ? "running" : "stopped";
                            var privacy_state = $("#campaign_privacy")[0].checked ? "shared" : "private";
                            var args = {
                                campaign_urn : urn,
                                running_state : running_state,
                                privacy_state : privacy_state,
                                description : $("#campaign_description").val(),
                                class_list_remove : longdata.classes,
                                class_list_add : $("#campaign_class").val()
                            }

                            //update xml only if selected
                            if(xmldata){
                                args.xml = fixxml(xmldata, longdata.name ,urn);
                            }

                            oh.campaign.update(args).done(function(){
                                td3.text(running_state);
                                $('#myModal').modal("hide")
                            }).always(function(){
                                btn.removeAttr("disabled");
                            });
                        });
                    });
                }

                // Disable for current deployment because confusing?
                //a3.hide()
                //a4.hide()
                //a5.hide()

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
                        var sharedcount = counts.shared ? counts.shared[0].count : 0;
                    }
                    td4.text(count);
                }).always(function(){
                    updateProgress((progress++/total) * 75 + 25);
                });
            });

            //data tables widget
            function initTable(){
                table = $('#campaigntable').DataTable( {
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

            //resetters
            $("#myModal").on("hidden.bs.modal", function(){
                $(".xml-upload-form").show();
                //$(".fileinput").fileinput("clear");
            })

            //expand function
            $('#campaigntable').on('click', "tbody td:not('.buttontd')", function () {
                var tr = $(this).parent()
                var row = table.row(tr);
                if(tr.attr("role") != "row") return;
         
                if ( row.child.isShown() ) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                } else {
                    // Open this row
                    row.child( makerow(row.data(), tr.data("campaigndata"))).show();
                    tr.addClass('shown');
                }
            });          
        });

        //get users
        oh.user.read().done(function(x){
            $.each(Object.keys(x).sort(), function( i, name ) {
                //$("#campaign_author").append($("<option />").text(name));
            });
        });

        //get classes
        oh.class.read().done(function(x){
            $.each(Object.keys(x).sort(), function( i, urn ) {
                $("#campaign_class").append($("<option />").text(urn).attr("value", urn));
            });
        });
    });

    updateProgress = _.throttle(function(pct){
        $(".progress-bar").css("width", + pct + "%");
    }, 300);

    function message(msg, type){
        // type must be one of success, info, warning, danger
        type = type || "danger"
        $("#errordiv").empty().append('<div class="alert alert-' + type + '"><a href="#" class="close" data-dismiss="alert">&times;</a>' + msg + '</div>');
        $('html, body').animate({
           scrollTop: 100
        }, 200);
    }

    //XML parser for mixed case tag names (HTML only supports lowercase tags)
    var parse = (function(parser, jQuery){
        return function(str) {
            return jQuery(parser.parseFromString(str, "text/xml").documentElement)
        }
    })(new DOMParser(), jQuery)

    function fixxml(input, name, urn){
        var xml = $.parseXML(input);
        var campaign = $("campaign", xml);
        campaign.children("campaignName").remove();
        campaign.children("campaignUrn").remove();
        campaign.prepend(parse("<campaignName/>").text(name))
        campaign.prepend(parse("<campaignUrn/>").text(urn))
        return (new XMLSerializer()).serializeToString(xml);
    }

    function makerow(rowdata, campaign) {
        var row = $('<div/>').addClass('row').addClass("response-row");
        $("<h5>").text(campaign.urn).appendTo(row);
        var p = $("<p />").appendTo(row).html("<i>" + (campaign.description || "No description.") + "</i>")
        console.log(campaign)
        return row;
    }

})();
