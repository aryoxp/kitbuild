$(() => {
  // jQuery onReady callback
  let app = KitBuildApp.instance();
});

// short hand for logger class
// so to log something, one could simply use:
// Log.l('action', data);
class L {
  static log() {}
}

class KitBuildApp {
  constructor() {
    this.kbui = KitBuildUI.instance(KitBuildApp.canvasId);
    let canvas = this.kbui.canvases.get(KitBuildApp.canvasId);
    canvas.addToolbarTool(KitBuildToolbar.UNDO_REDO, { priority: 3 });
    canvas.addToolbarTool(KitBuildToolbar.CAMERA, { priority: 4 });
    canvas.addToolbarTool(KitBuildToolbar.UTILITY, {
      priority: 5,
      trash: false,
    });
    canvas.addToolbarTool(KitBuildToolbar.LAYOUT, {priority: 6}); //{ stack: "right" }
    canvas.toolbar.render();

    canvas.addCanvasTool(KitBuildCanvasTool.CENTROID);

    this.canvas = canvas;
    this.session = Core.instance().session();
    this.ajax = Core.instance().ajax();
    this.runtime = Core.instance().runtime();
    this.config = Core.instance().config();

    // Hack for sidebar-panel show/hide
    // To auto-resize the canvas.
    // AA
    // let observer = new MutationObserver((mutations) => $(`#${KitBuildApp.canvasId} > div`).css('width', 0))
    // observer.observe(document.querySelector('#admin-sidebar-panel'), {attributes: true})
    // Enable tooltip
    $('[data-bs-toggle="tooltip"]').tooltip({ html: true });

    // Browser lifecycle event
    KitBuildUI.addLifeCycleListener(KitBuildApp.onBrowserStateChange);

    // Logger
    if (typeof KitBuildLogger != "undefined") {
      let sessid = Core.instance().config().get("sessid");
      let url = Core.instance().config().get('baseurl')
      let seq = Core.instance().config().get("seq");
      window.history.replaceState({}, document.title, url);
      // this.logger = KitBuildLogger.instance(
      //   null,
      //   seq ?? 0,
      //   sessid,
      //   canvas,
      //   null
      // ).enable();
      // if (this.logger.seq != 0) this.seq = seq;
      // KitBuildApp.loggerListener = this.logger.onCanvasEvent.bind(this.logger);
      // L.log = this.logger.log.bind(this.logger);
      // L.log(`init-${this.constructor.name}`);
      canvas.on("event", KitBuildApp.loggerListener);
    }


    // console.log(this, typeof KitBuildLogger);

    this.handleEvent();
    this.handleRefresh();
  }

  static instance() {
    KitBuildApp.inst = new KitBuildApp();
    return KitBuildApp.inst;
  }

  setUser(user = null) {
    this.user = user;
  }

  setConceptMap(conceptMap) {
    console.warn("CONCEPT MAP SET:", conceptMap);
    this.conceptMap = conceptMap;
    if (conceptMap) {
      this.canvas.direction = conceptMap.map.direction;
      this.session.set("cmid", conceptMap.map.cmid);
      let status =
        `<span class="mx-2 d-flex align-items-center status-cmap">` +
        `<span class="badge rounded-pill bg-secondary">ID: ${conceptMap.map.cmid}</span>` +
        `<span class="text-secondary ms-2 text-truncate"><small>${conceptMap.map.title}</small></span>` +
        `</span>`;
      StatusBar.instance().remove(".status-cmap").prepend(status);
    } else {
      StatusBar.instance().remove(".status-cmap");
      this.session.unset("cmid");
    }
    $('[data-bs-toggle="tooltip"]').tooltip({ html: true });
  }

  setKitMap(kitMap = null) {
    console.warn("KIT MAP SET:", kitMap);
    this.kitMap = kitMap;
    if (kitMap) {
      this.setConceptMap(kitMap.conceptMap);
      this.session.set("kid", kitMap.map.kid);
      let tooltipText = "";
      tooltipText += "FBLV:" + kitMap.parsedOptions.feedbacklevel;
      tooltipText += ",FBSV:" + kitMap.parsedOptions.feedbacksave;
      tooltipText += ",FFB:" + kitMap.parsedOptions.fullfeedback;
      tooltipText += ",LOG:" + kitMap.parsedOptions.log;
      tooltipText += ",MOD:" + kitMap.parsedOptions.modification;
      tooltipText += ",RD:" + kitMap.parsedOptions.readcontent;
      tooltipText += ",RST:" + kitMap.parsedOptions.reset;
      tooltipText += ",SVLD:" + kitMap.parsedOptions.saveload;
      let status =
        `<span class="mx-2 d-flex align-items-center status-kit">` +
        `<span class="badge rounded-pill bg-primary" role="button" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltipText}">ID: ${kitMap.map.kid}</span>` +
        `<span class="text-secondary ms-2 text-truncate"><small>${kitMap.map.name}</small></span>` +
        `</span>`;
      KitBuild.getTextOfKit(kitMap.map.kid).then((text) => {
        this.text = text;
        let textLabel = text ? `Text: ${text.title}` : "Text: None";
        let statusText = `<span class="mx-2 d-flex align-items-center status-text">`;
        statusText += `<span class="badge rounded-pill bg-danger">${textLabel}</span>`;
        statusText += `</span>`;
        StatusBar.instance().remove(".status-text").append(statusText);
      });
      StatusBar.instance().remove(".status-kit").append(status);
    } else {
      this.setConceptMap();
      this.text = null;
      this.session.unset("kid");
      StatusBar.instance().remove(".status-kit");
      StatusBar.instance().remove(".status-text");
    }
    $('[data-bs-toggle="tooltip"]').tooltip({ html: true });
  }

  setLearnerMap(learnerMap) {
    console.warn("LEARNER MAP SET:", learnerMap);
    this.learnerMap = learnerMap;
    if (learnerMap) {
      this.session.set("lmid", learnerMap.map.lmid);
      let status =
        `<span class="mx-2 d-flex align-items-center status-learnermap">` +
        `<span class="badge rounded-pill bg-warning text-dark">ID: ${learnerMap.map.lmid}</span>` +
        `</span>`;
      StatusBar.instance().remove(".status-learnermap").append(status);
    } else {
      StatusBar.instance().remove(".status-learnermap");
      this.session.unset("lmid");
    }
  }

  openLearnerMap(kitMap, learnerMap = null) {
    let promise = new Promise((resolve, reject) => {
      if (!kitMap) {
        UI.errorDialog('Invalid Kit!').show();
        return;
      }
      this.setKitMap(kitMap);
      KitBuildApp.parseKitMapOptions(kitMap);
      this.logger.setConceptMap(kitMap.conceptMap);
      this.setLearnerMap(learnerMap ?? undefined);
      L.log("open-kit", kitMap.map);
      if (learnerMap) {
        L.log("continue-recompose", learnerMap.map, null, {
          lmid: learnerMap.map.lmid,
          kid: kitMap.map.kid,
          includeMapData: true,
        });
        this.logger.setLearnerMapId(learnerMap.map.lmid);
        learnerMap.kitMap = kitMap;
        learnerMap.conceptMap = kitMap.conceptMap;
        this.canvas.cy.elements().remove();
        this.canvas.cy.add(KitBuildUI.composeLearnerMap(learnerMap));
        this.canvas.applyElementStyle();
        this.canvas.toolbar.tools
          .get(KitBuildToolbar.CAMERA)
          .fit(null, { duration: 0 })
          .then(() => {
            KitBuildApp.collab(
              "command",
              "set-kit-map",
              kitMap,
              this.canvas.cy.elements().jsons()
            );
          });
        // this.setLearnerMap(learnerMap);
        // this.logger.setLearnerMapId(learnerMap.map.lmid);
        // L.log("load-learner-map", learnerMap.map, null, {
        //   includeMapData: true,
        //   lmid: learnerMap.map.lmid,
        // });
        // UI.info("Concept map loaded.").show();
        // confirm.hide();
        this.getFeedbackAndSubmitCount(learnerMap.map.author, learnerMap.map.kid, kitMap.parsedOptions);
        UI.success("Saved concept map has been loaded.").show();
        resolve(learnerMap);
      } else {
        this.logger.reset();
        L.log("begin-recompose");
        KitBuildApp.resetMapToKit(kitMap, this.canvas).then(() => {
          let cyData = this.canvas.cy.elements().jsons();
          KitBuildApp.collab("command", "set-kit-map", kitMap, cyData);
          this.saveInitialLearnerMap(kitMap).then((learnerMap) => {
            resolve(learnerMap);
            this.getFeedbackAndSubmitCount(learnerMap.map.author, learnerMap.map.kid, kitMap.parsedOptions);
          }, err => reject(err));
        });
      }
    });
    return promise;
  }

  saveInitialLearnerMap(kitMap) {
    let promise = new Promise((resolve, reject) => {
      let data = Object.assign(
        {
          lmid: null,
          kid: kitMap.map.kid,
          author: KitBuildApp.inst.user
            ? KitBuildApp.inst.user.username
            : null,
          type: "draft",
          cmid: kitMap.map.cmid,
          create_time: null,
          data: null,
        },
        KitBuildUI.buildConceptMapData(this.canvas)
      ); // console.log(data); // return
      this.ajax
        .post("kitBuildApi/saveLearnerMap", {
          data: Core.compress(data),
        })
        .then((learnerMap) => {
          // console.log(kitMap);
          this.setLearnerMap(learnerMap);
          this.logger.setLearnerMapId(learnerMap.map.lmid);
          UI.success("Concept map has been initialized.").show();
          L.log("learnermap-initialized", learnerMap.map, null, {
            lmid: learnerMap.map.lmid,
            includeMapData: true,
          });
          this.getFeedbackAndSubmitCount(learnerMap.map.author, learnerMap.map.kid, kitMap.parsedOptions);
          resolve(learnerMap);
        })
        .catch((error) => {
          UI.error(error).show();
          reject(error);
        });
    });
    return promise;
  }

  getFeedbackAndSubmitCount(username, kid, options = null) {
    $('.bt-feedback .count').html(``);
    $('.bt-submit .count').html(``);
    if (username && kid) {
      this.ajax.post('kitBuildApi/getFeedbackAndSubmitCount', {
        username: username,
        kid: kid
      }).then((count) => {
        if (options && options.countfb) 
          $('.bt-feedback .count').html(`(&times;${count.feedback})`);
        if (options && options.countsubmit)
          $('.bt-submit .count').html(`(&times;${count.submit})`);
      }, (err) => UI.errorDialog(err));
    } else {
      let feedbackCount = 0;
      let submitCount = 0;
      if (options && options.countfb)
        $('.bt-feedback .count').html(`(&times;${feedbackCount})`);
      if (options && options.countsubmit)
        $('.bt-submit .count').html(`(&times;${submitCount})`);
    }
  }

  handleEvent() {


    /**
     * Concept Map reader 
     * */
    const fileInput = $('.file-input');
    const droparea = $('.file-drop-area');
    const deleteButton = $('.item-delete');
    
    fileInput.on('dragenter focus click', () => { droparea.addClass('is-active') });
    fileInput.on('dragleave blur drop', () => { droparea.removeClass('is-active') });
    fileInput.on('change', () => {
      let filesCount = $(fileInput)[0].files.length;
      let textContainer = $(fileInput).prev();
      if (filesCount === 1) {
        let file = $(fileInput)[0].files[0];
        let reader = new FileReader();
        reader.onload = function(event) {
          let content = event.target.result;
          console.log(content);
        };
        // console.log(file);
        reader.readAsText(file);
        let fileName = $(fileInput).val().split('\\').pop();
        textContainer.text(fileName);
        $('.item-delete').css('display', 'inline-block');
      } else if (filesCount === 0) {
        textContainer.text('or drop files here');
        $('.item-delete').css('display', 'none');
      } else {
        textContainer.text(filesCount + ' files selected');
        $('.item-delete').css('display', 'inline-block');
      }
    });
    deleteButton.on('click', () => {
      $('.file-input').val(null);
      $('.file-msg').text('or drop files here');
      $('.item-delete').css('display', 'none');
    });










    let openDialog = UI.modal("#concept-map-open-dialog", {
      hideElement: ".bt-cancel",
      width: "700px",
    });
    let contentDialog = UI.modal("#kit-content-dialog", {
      hideElement: ".bt-close",
      backdrop: false,
      get height() {
        return ($("body").height() * 0.7) | 0;
      },
      get offset() {
        return { left: ($("body").width() * 0.1) | 0 };
      },
      draggable: true,
      dragHandle: ".drag-handle",
      resizable: true,
      resizeHandle: ".resize-handle",
      minWidth: 375,
      minHeight: 200,
      onShow: () => {
        let sdown = new showdown.Converter({
          strikethrough: true,
          tables: true,
          simplifiedAutoLink: true,
        });
        sdown.setFlavor("github");
        console.log(contentDialog.text);
        let htmlText = contentDialog.text
          ? sdown.makeHtml(contentDialog.text.content)
          : "<em>Content text unavailable.</em>";
        $("#kit-content-dialog .content").html(htmlText);
        hljs.highlightAll();
      },
    });
    contentDialog.setContent = (text, type = "md") => {
      contentDialog.text = text;
      return contentDialog;
    };
    contentDialog.on("event", (event, data) => {
      L.log(`content-${event}`, data);
    });

    let feedbackDialog = UI.modal("#feedback-dialog", {
      hideElement: ".bt-close",
      backdrop: false,
      draggable: true,
      dragHandle: ".drag-handle",
      width: 375,
      onShow: () => {
        $("#feedback-dialog")
          .off("click")
          .on("click", ".bt-modify", (e) => {
            $(".app-navbar .bt-clear-feedback").trigger("click");
            feedbackDialog.hide();
          });
      },
    });
    feedbackDialog.setCompare = (
      compare,
      level = Analyzer.MATCH | Analyzer.EXCESS
    ) => {
      feedbackDialog.compare = compare;
      console.log(compare, level);
      let content = "";
      if (compare.match.length && level & Analyzer.MATCH) {
        content += `<div class="d-flex align-items-center"><i class="bi bi-check-circle-fill text-success fs-1 mx-3"></i> `;
        content += `<span>You have <strong class="text-success fs-bold">${compare.match.length} matching</strong> propositions.</span></div>`;
      }
      if (compare.excess.length && level & Analyzer.EXCESS) {
        content += `<div class="d-flex align-items-center"><i class="bi bi-exclamation-triangle-fill text-primary fs-1 mx-3"></i> `;
        content += `<span>You have <strong class="text-primary fs-bold">${compare.excess.length} excessive</strong> propositions.</span></div>`;
      }
      if (compare.miss.length && level != Analyzer.NONE) {
        content += `<div class="d-flex align-items-center"><i class="bi bi-exclamation-triangle-fill text-danger fs-1 mx-3"></i> `;
        content += `<span>You have <strong class="text-danger fs-bold">${compare.miss.length} missing</strong> propositions.</span></div>`;
      }

      if (compare.excess.length == 0 && compare.miss.length == 0) {
        content = `<div class="d-flex align-items-center"><i class="bi bi-check-circle-fill text-success fs-1 mx-3"></i> `;
        content += `<span><span class="text-success">Great!</span><br>All the propositions are <strong class="text-success fs-bold">matching</strong>.</span></div>`;
      }

      $("#feedback-dialog .feedback-content").html(content);
      return feedbackDialog;
    };

    /**
     * Open or Create New Kit
     * */

    $(".app-navbar").on("click", ".bt-open-kit", () => {
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");
      let tid = openDialog.tid;
      if (!tid)
        $("#concept-map-open-dialog .list-topic .list-item.default").trigger(
          "click"
        );
      else
        $(
          `#concept-map-open-dialog .list-topic .list-item[data-tid="${tid}"]`
        ).trigger("click");
      $("#concept-map-open-dialog .bt-refresh-topic-list").trigger("click");
      openDialog.show();
    });

    /**
     * Content
     * */

    $(".app-navbar").on("click", ".bt-content", () => {
      // console.log(KitBuildApp.inst)
      if (!KitBuildApp.inst.kitMap) {
        UI.dialog("Please open a kit to see its content.").show();
        return;
      }
      contentDialog.setContent(this.text).show();
    });

    $("#kit-content-dialog .bt-scroll-top").on("click", (e) => {
      $("#kit-content-dialog .content").parent().animate({ scrollTop: 0 }, 200);
    });

    $("#kit-content-dialog .bt-scroll-more").on("click", (e) => {
      let height = $("#kit-content-dialog .content").parent().height();
      let scrollTop = $("#kit-content-dialog .content").parent().scrollTop();
      $("#kit-content-dialog .content")
        .parent()
        .animate({ scrollTop: scrollTop + height - 16 }, 200);
    });

    /**
     * Save Load Learner Map
     * */

    $(".app-navbar").on("click", ".bt-save", () => {
      // console.log(KitBuildApp.inst)
      let learnerMap = KitBuildApp.inst.learnerMap;
      let kitMap = KitBuildApp.inst.kitMap;
      if (!kitMap) {
        UI.warning("Please open a kit.").show();
        return;
      }
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");
      // console.log(learnerMap)
      let data = Object.assign(
        {
          lmid: learnerMap ? learnerMap.map.lmid : null,
          kid: kitMap.map.kid,
          author: KitBuildApp.inst.user ? KitBuildApp.inst.user.username : null,
          type: "draft",
          cmid: kitMap.map.cmid,
          create_time: null,
          data: null,
        },
        KitBuildUI.buildConceptMapData(this.canvas)
      ); // console.log(data); // return
      this.ajax
        .post("kitBuildApi/saveLearnerMap", { data: Core.compress(data) })
        .then((learnerMap) => {
          // console.log(kitMap);
          this.logger.setLearnerMapId(learnerMap.map.lmid);
          L.log("save-learner-map", learnerMap.map, null, {
            includeMapData: true,
            lmid: learnerMap.map.lmid,
          });
          KitBuildApp.inst.setLearnerMap(learnerMap);
          UI.success("Concept map has been saved successfully.").show();
        })
        .catch((error) => {
          UI.error(error).show();
        });
    });
    $(".app-navbar").on("click", ".bt-load", () => {
      let kitMap = KitBuildApp.inst.kitMap;
      if (!kitMap) {
        UI.warning("Please open a kit.").show();
        return;
      }
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");

      let data = {
        kid: kitMap.map.kid,
        username: KitBuildApp.inst.user.username,
      };
      if (!data.username) delete data.username;
      this.ajax
        .post("kitBuildApi/getLastDraftLearnerMapOfUser", data)
        .then((learnerMap) => {
          if (!learnerMap) {
            UI.warning("No user saved map data for this kit.").show();
            return;
          }
          if (this.canvas.cy.elements().length) {
            let confirm = UI.confirm("Load saved concept map?")
              .positive(() => {
                learnerMap.kitMap = kitMap;
                learnerMap.conceptMap = kitMap.conceptMap;
                this.canvas.cy.elements().remove();
                this.canvas.cy.add(KitBuildUI.composeLearnerMap(learnerMap));
                this.canvas.applyElementStyle();
                this.canvas.toolbar.tools
                  .get(KitBuildToolbar.CAMERA)
                  .fit(null, { duration: 0 })
                  .then(() => {
                    KitBuildApp.collab(
                      "command",
                      "set-kit-map",
                      kitMap,
                      this.canvas.cy.elements().jsons()
                    );
                  });
                KitBuildApp.inst.setLearnerMap(learnerMap);
                this.logger.setLearnerMapId(learnerMap.map.lmid);
                L.log("load-learner-map", learnerMap.map, null, {
                  includeMapData: true,
                  lmid: learnerMap.map.lmid,
                });
                UI.info("Concept map loaded.").show();
                confirm.hide();
              })
              .show();
            return;
          }
          KitBuildApp.openLearnerMap(learnerMap.map.lmid, this.canvas);
        })
        .catch((error) => {
          console.error(error);
          UI.error("Unable to load saved concept map.").show();
        });
    });

    /**
     * Reset concept map to kit
     * */

    $(".app-navbar").on("click", ".bt-reset", (e) => {
      if (!KitBuildApp.inst.kitMap) {
        UI.info("Please open a kit.");
        return;
      }
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");

      let confirm = UI.confirm(
        "Do you want to reset this concept map as defined in the kit?"
      )
        .positive(() => {
          KitBuild.openKitMap(KitBuildApp.inst.kitMap.map.kid).then(
            (kitMap) => {
              KitBuildApp.parseKitMapOptions(kitMap);
              KitBuildApp.resetMapToKit(kitMap, this.canvas).then(() => {
                KitBuildApp.collab(
                  "command",
                  "set-kit-map",
                  kitMap,
                  this.canvas.cy.elements().jsons()
                );
                L.log("reset-learner-map", kitMap.map, null, {
                  includeMapData: true,
                  lmid: this.learnerMap.map.lmid,
                });
              });
              let undoRedo = this.canvas.toolbar.tools.get(
                KitBuildToolbar.UNDO_REDO
              );
              if (undoRedo) undoRedo.clearStacks().updateStacksStateButton();
              confirm.hide();
              UI.info("Concept map has been reset.").show();
              return;
            }
          );
        })
        .show();
    });

    /**
     *
     * Feedback
     */
    $(".app-navbar").on("click", ".bt-feedback", () => {
      if (!KitBuildApp.inst.kitMap) return;
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");

      let learnerMapData = KitBuildUI.buildConceptMapData(this.canvas);
      feedbackDialog.learnerMapEdgesData = this.canvas.cy.edges().jsons();

      let feedbacksave = KitBuildApp.inst.kitMap.parsedOptions.feedbacksave;
      if (feedbacksave) {
        let kitMap = KitBuildApp.inst.kitMap;
        let data = Object.assign(
          {
            lmid: null, // so it will insert new rather than update
            kid: kitMap.map.kid,
            author: this.user ? this.user.username : null,
            type: "feedback",
            cmid: kitMap.map.cmid,
            create_time: null,
            data: null,
          },
          learnerMapData
        );
        let kid = kitMap.map.kid;
        let username = this.user.username;
        let options = kitMap.parsedOptions ? kitMap.parsedOptions : null
        // console.log(data, kid, username); // return
        this.ajax
          .post("kitBuildApi/saveLearnerMap", { data: Core.compress(data) })
          .then((learnerMap) => {
            console.warn(
              "Concept map save-on-feedback has been saved successfully."
            );
            this.getFeedbackAndSubmitCount(username, kid, options);
          })
          .catch((error) => {
            console.error(error);
            this.getFeedbackAndSubmitCount(username, kid, options);
          });
      }

      learnerMapData.conceptMap = KitBuildApp.inst.conceptMap;
      Analyzer.composePropositions(learnerMapData);
      let direction = learnerMapData.conceptMap.map.direction;
      let feedbacklevel = KitBuildApp.inst.kitMap.parsedOptions.feedbacklevel;
      let compare = Analyzer.compare(learnerMapData, direction);
      let level = Analyzer.NONE;
      let dialogLevel = Analyzer.NONE;
      switch (feedbacklevel) {
        case 0:
        case 1:
          level = Analyzer.NONE;
          break;
        case 2:
          level = Analyzer.MATCH | Analyzer.EXCESS;
          break;
        case 3:
          level = Analyzer.MATCH | Analyzer.EXCESS | Analyzer.EXPECT;
          break;
        case 4:
          level = Analyzer.MATCH | Analyzer.EXCESS | Analyzer.MISS;
          break;
      }
      switch (feedbacklevel) {
        case 0:
          dialogLevel = Analyzer.NONE;
          break;
        case 1:
        case 2:
        case 3:
        case 4:
          dialogLevel = Analyzer.MATCH | Analyzer.EXCESS;
          break;
      }

      Analyzer.showCompareMap(compare, this.canvas.cy, direction, level);
      this.canvas.canvasTool
        .enableIndicator(false)
        .enableConnector(false)
        .clearCanvas()
        .clearIndicatorCanvas();

      if (feedbacklevel == 0) {
        UI.dialog("Feedback is not enabled for this kit.")
          .on("dismiss", () => {
            $(".app-navbar .bt-clear-feedback").trigger("click");
          })
          .show();
      } else feedbackDialog.setCompare(compare, dialogLevel).show();

      L.log("feedback", {
        level: level,
        compare: compare,
      });
    });
    $(".app-navbar").on("click", ".bt-clear-feedback", () => {
      if (!feedbackDialog.learnerMapEdgesData) return;
      this.canvas.cy.edges().remove();
      this.canvas.cy.add(feedbackDialog.learnerMapEdgesData);
      this.canvas.applyElementStyle();
      this.canvas.canvasTool
        .enableIndicator()
        .enableConnector()
        .clearCanvas()
        .clearIndicatorCanvas();
      feedbackDialog.learnerMapEdgesData = null;
      L.log("clear-feedback");
    });

    /**
     *
     * Submit
     */
    $(".app-navbar").on("click", ".bt-submit", () => {
      if (feedbackDialog.learnerMapEdgesData)
        $(".app-navbar .bt-clear-feedback").trigger("click");

      let learnerMapData = KitBuildUI.buildConceptMapData(this.canvas);
      let confirm = UI.confirm(
        "Do you want to submit your concept map?<br/>This will end your concept map recomposition session."
      )
        .positive(() => {
          let kitMap = KitBuildApp.inst.kitMap;
          let data = Object.assign(
            {
              lmid: null, // so it will insert new rather than update
              kid: kitMap.map.kid,
              author: KitBuildApp.inst.user
                ? KitBuildApp.inst.user.username
                : null,
              type: "fix",
              cmid: kitMap.map.cmid,
              create_time: null,
              data: null,
            },
            learnerMapData
          ); // console.log(data); // return
          confirm.hide();

          this.ajax
            .post("kitBuildApi/saveLearnerMap", { data: Core.compress(data) })
            .then((learnerMap) => {
              // TODO: check if kit allow review to show full comparison?
              // TODO: set session of submitted learner map for review
              this.session
                .set("flmid", learnerMap.map.lmid)
                .then((result) => {
                  L.log(
                    "submit-learner-map",
                    {
                      lmid: learnerMap.map.lmid,
                    },
                    null,
                    {
                      includeMapData: true,
                      lmid: learnerMap.map.lmid,
                    }
                  );
                  UI.success(
                    "Concept map has been submitted. Redirecting to Review page..."
                  ).show();
                  setTimeout(() => {
                    // TODO: and then change state to full feedback if set in kit options
                    let baseurl = Core.instance().config().get("baseurl");
                    window.location.href = baseurl + "review/index/" + this.logger.seq;
                  }, 2000);
                })
                .catch(() => {
                  UI.error("Unable to proceed to review.").show();
                });
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .show();
    });

  }

  /**
   *
   * Handle refresh web browser
   */

  handleRefresh() {
    // let stateData = JSON.parse(localStorage.getItem(KitBuildApp.name));
    // console.warn("RESTORE STATE:", stateData)
    // this.session.getAll().then((sessions) => {
    //   // console.log(sessions)

    //   try {
    //     if (stateData && stateData.logger) {
    //       // restore previous logger data and sequence
    //       // console.log(this.logger.seq);
    //       this.logger.username = sessions.user ? sessions.user.username : null;
    //       this.logger.seq = this.logger.seq == 1 ? stateData.logger.seq : this.logger.seq;
    //       this.logger.sessid = Core.instance().config().get("sessid");
    //       this.logger.canvas = this.canvas;
    //       this.logger.enable();
    //       L.log('restore-logger-state');
    //       // reattach logger
    //       if (KitBuildApp.loggerListener)
    //         this.canvas.off("event", KitBuildApp.loggerListener);
    //       KitBuildApp.loggerListener =
    //         KitBuildApp.inst.logger.onCanvasEvent.bind(KitBuildApp.inst.logger);
    //       this.canvas.on("event", KitBuildApp.loggerListener);
    //     }
    //   } catch (error) {
    //     console.warn(error);
    //   }

    //   let kid = sessions.kid;
    //   let lmid = sessions.lmid;
    //   let promises = [];
    //   if (kid) promises.push(KitBuild.openKitMap(kid));
    //   if (lmid) promises.push(KitBuild.openLearnerMap(lmid));
    //   Promise.all(promises).then((maps) => {
    //     let [kitMap, learnerMap] = maps;
    //     // console.error(kitMap, learnerMap);
    //     KitBuildApp.parseKitMapOptions(kitMap);
    //     if (kitMap && !learnerMap)
    //       KitBuildApp.resetMapToKit(kitMap, this.canvas).then(() => {
    //         L.log("reset-map-to-kit", kitMap.map);
    //       });
    //     if (sessions.user && sessions.kid)
    //       this.getFeedbackAndSubmitCount(sessions.user.username, sessions.kid, kitMap.parsedOptions);
    //     if (learnerMap) {
    //       // console.log(learnerMap, this.logger)
    //       KitBuildApp.inst.setKitMap(kitMap);
    //       KitBuildApp.inst.setLearnerMap(learnerMap);
    //       learnerMap.kitMap = kitMap;
    //       learnerMap.conceptMap = kitMap.conceptMap;
    //       this.canvas.cy.elements().remove();
    //       this.canvas.cy.add(KitBuildUI.composeLearnerMap(learnerMap));
    //       this.canvas.applyElementStyle();
    //       this.canvas.toolbar.tools
    //         .get(KitBuildToolbar.CAMERA)
    //         .fit(null, { duration: 0 });
    //       this.logger.setLearnerMapId(learnerMap.map.lmid);
    //       this.logger.setConceptMap(kitMap.conceptMap);
    //       L.log("restore-kit", kitMap.map);
    //       L.log("restore-learner-map", learnerMap.map, null, {
    //         lmid: learnerMap.map.lmid,
    //         includeMapData: true,
    //       });
    //     } // else UI.warning('Unable to display kit.').show()
    //   });

    //   KitBuildApp.enableNavbarButton(false);
    //   if (sessions.user) {
    //     this.setUser(sessions.user);
    //     this.initCollab(sessions.user);
    //     KitBuildApp.enableNavbarButton(true);
    //     KitBuildCollab.enableControl();
    //     let status =
    //       `<span class="mx-2 d-flex align-items-center status-user" style="white-space: nowrap;">` +
    //       `<small class="text-dark fw-bold">${sessions.user.name}</small>` +
    //       `</span>`;
    //     StatusBar.instance().remove(".status-user").prepend(status);
    //     this.logger.username = sessions.user.username;
    //   } else $(".app-navbar .bt-sign-in").trigger("click");

    //   // listen to events for broadcast to collaboration room as commands
    //   this.canvas.on("event", KitBuildApp.onCanvasEvent);
    // });
  }

}

KitBuildApp.canvasId = "recompose-canvas";

KitBuildApp.onBrowserStateChange = (event) => {
  // console.warn(event)
  L.log("browser-state-change", { from: event.oldState, to: event.newState });
  if (event.newState == "terminated") {
    let stateData = {};
    if (KitBuildApp.inst && KitBuildApp.inst.logger)
      stateData.logger = {
        username: KitBuildApp.inst.logger.username,
        seq: KitBuildApp.inst.logger.seq,
        sessid: KitBuildApp.inst.logger.sessid,
        enabled: KitBuildApp.inst.logger.enabled,
      };
    stateData.map = Core.compress(
      KitBuildApp.inst.canvas.cy.elements().jsons()
    );
    let cmapAppStateData = JSON.stringify(Object.assign({}, stateData));
    localStorage.setItem(KitBuildApp.name, cmapAppStateData);
  }
};

KitBuildApp.onCanvasEvent = (canvasId, event, data) => {
  // KitBuildApp.collab("command", event, canvasId, data);
};

// generate/apply map state
KitBuildApp.generateMapState = () => {
  return new Promise((resolve, reject) => {
    let mapState = {
      kitMap: null,
      cyData: [],
    };
    if (KitBuildApp.inst.kitMap) {
      KitBuildApp.inst.kitMap.conceptMap.map.direction =
        KitBuildApp.inst.canvas.direction;
      mapState = {
        kitMap: KitBuildApp.inst.kitMap,
        cyData: KitBuildApp.inst.canvas.cy.elements().jsons(),
      };
    }
    resolve(mapState);
  });
};
// KitBuildApp.applyMapState = (mapState) => {
//   return new Promise((resolve, reject) => {
//     let kitMap = mapState.kitMap;
//     let cyData = mapState.cyData;
//     KitBuildApp.inst.setKitMap(kitMap);
//     KitBuildApp.inst.canvas.cy.elements().remove();
//     if (!kitMap || !cyData) {
//       // console.log(mapState)
//     } else {
//       KitBuildApp.inst.canvas.cy.add(cyData ? cyData : {}).unselect();
//       KitBuildApp.inst.canvas.applyElementStyle();
//       KitBuildApp.inst.canvas.toolbar.tools
//         .get(KitBuildToolbar.CAMERA)
//         .fit(null, { duration: 0 });
//       // KitBuildApp.inst.canvas.toolbar.tools.get(KitBuildToolbar.NODE_CREATE).setActiveDirection(conceptMap.map.direction)
//       KitBuildApp.inst.canvas.toolbar.tools
//         .get(KitBuildToolbar.UNDO_REDO)
//         .clearStacks()
//         .updateStacksStateButton();
//     }
//     KitBuildApp.inst.canvas.canvasTool.clearCanvas().clearIndicatorCanvas();
//     resolve(mapState);
//   });
// };

/**
 *
 * Helpers
 */

KitBuildApp.parseKitMapOptions = (kitMap) => {
  if (!kitMap) return;
  kitMap.parsedOptions = KitBuildApp.parseOptions(kitMap.map.options, {
    feedbacklevel: 2,
    fullfeedback: 1,
    modification: 1,
    readcontent: 1,
    saveload: 1,
    reset: 1,
    feedbacksave: 1,
    countfb: 1,
    countsubmit: 1,
    log: 0,
  });
};

KitBuildApp.resetMapToKit = (kitMap, canvas) => {
  return new Promise((resolve, reject) => {
    // will also set and cache the concept map
    KitBuildApp.inst.setKitMap(kitMap);
    canvas.cy.elements().remove();
    canvas.cy.add(KitBuildUI.composeKitMap(kitMap));
    canvas.applyElementStyle();
    if (kitMap.map.layout == "random") {
      canvas.cy
        .elements()
        .layout({
          name: "fcose",
          animationDuration: 0,
          fit: false,
          stop: () => {
            canvas.toolbar.tools
              .get(KitBuildToolbar.CAMERA)
              .center(null, { duration: 0 });
            resolve(true);
          },
        })
        .run();
    } else {
      canvas.toolbar.tools
        .get(KitBuildToolbar.CAMERA)
        .fit(null, { duration: 0 });
      resolve(true);
    }

    // TODO: apply kit options to UI
    // console.log(kitMap)

    let feedbacklevelFeature =
      '<button class="bt-feedback btn btn-warning"><i class="bi bi-eye-fill"></i> Feedback <span class="count"></span></button>';
    feedbacklevelFeature +=
      '<button class="bt-clear-feedback btn btn-warning"><i class="bi bi-eye-slash-fill"></i> Clear Feedback</button>';
    let saveloadFeature =
      '<button class="bt-save btn btn-secondary"><i class="bi bi-download"></i> Save</button>';
    saveloadFeature +=
      '<button class="bt-load btn btn-secondary"><i class="bi bi-upload"></i> Load</button>';
    let readcontentFeature =
      '<button class="bt-content btn btn-sm btn-secondary"><i class="bi bi-file-text-fill"></i> Contents</button>';
    let resetFeature =
      '<button class="bt-reset btn btn-danger"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>';

    if (kitMap.parsedOptions.feedbacklevel)
      $("#recompose-feedbacklevel")
        .html(feedbacklevelFeature)
        .removeClass("d-none");
    else $("#recompose-feedbacklevel").html("").addClass("d-none");
    if (kitMap.parsedOptions.saveload)
      $("#recompose-saveload").html(saveloadFeature).removeClass("d-none");
    else $("#recompose-saveload").html("").addClass("d-none");
    if (kitMap.parsedOptions.reset)
      $("#recompose-reset").html(resetFeature).removeClass("d-none");
    else $("#recompose-reset").html("").addClass("d-none");
    if (kitMap.parsedOptions.readcontent)
      $("#recompose-readcontent")
        .html(readcontentFeature)
        .removeClass("d-none");
    else $("#recompose-readcontent").html("").addClass("d-none");
    return;
  });
};

KitBuildApp.parseOptions = (optionJsonString, defaultValueIfNull) => {
  if (optionJsonString === null) return defaultValueIfNull;
  let option,
    defopt = defaultValueIfNull;
  try {
    option = Object.assign({}, defopt, JSON.parse(optionJsonString));
    option.feedbacklevel = option.feedbacklevel
      ? parseInt(option.feedbacklevel)
      : defopt.feedbacklevel;
  } catch (error) {
    UI.error(error).show();
  }
  return option;
};

// KitBuildApp.updateSignInOutButton = () => {
//   Core.instance().session().getAll().then(sessions => { 
//     // console.log(sessions)
//     if (sessions.user) {
//       $('.bt-sign-in').addClass('d-none');
//       $('.bt-logout').removeClass('d-none');
//       $('.bt-profile').removeClass('d-none');
//     } else {
//       $('.bt-sign-in').removeClass('d-none');
//       $('.bt-logout').addClass('d-none');
//       $('.bt-profile').addClass('d-none')
//     }
//   });
// };

// KitBuildApp.enableNavbarButton = (enabled = true) => {
//   $("#recompose-readcontent button").prop("disabled", !enabled);
//   $("#recompose-saveload button").prop("disabled", !enabled);
//   $("#recompose-reset button").prop("disabled", !enabled);
//   $("#recompose-feedbacklevel button").prop("disabled", !enabled);
//   $(".bt-submit").prop("disabled", !enabled);
//   $(".bt-open-kit").prop("disabled", !enabled);
//   KitBuildApp.inst.canvas.toolbar.tools.forEach((tool) => {
//     tool.enable(enabled);
//   });
// };
