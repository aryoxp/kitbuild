<div class="d-flex flex-column vh-100">
  <!-- <a class="position-absolute d-flex align-items-center text-white px-3 text-decoration-none" href="<?php echo $this->location('../home'); ?>">
    <i class="bi bi-house pe-2" style="font-size: 1.8rem;"></i> <span>Home</span>
  </a> -->
  <div class="app-navbar d-flex p-2 ps-4">
    <div class="flex-fill">&nbsp;</div>
    <button class="bt-open-kit btn btn-sm btn-primary"><i class="bi bi-folder2-open"></i> Open Kit</button>
    <div class="btn-group btn-group-sm ms-2" id="recompose-readcontent">
      <button class="bt-content btn btn-sm btn-secondary"><i class="bi bi-file-text-fill"></i> Contents</button>
    </div>
    <!-- <div class="btn-group btn-group-sm ms-2" id="recompose-saveload">
      <button class="bt-save btn btn-secondary"><i class="bi bi-download"></i> <?php echo Lang::l('save'); ?></button>
      <button class="bt-load btn btn-secondary"><i class="bi bi-upload"></i> <?php echo Lang::l('load'); ?></button>
    </div> -->
    <div class="btn-group btn-group-sm ms-2" id="recompose-reset">
      <button class="bt-reset btn btn-danger"><i class="bi bi-arrow-counterclockwise"></i> <?php echo Lang::l('reset'); ?></button>
    </div>
    <div class="btn-group btn-group-sm ms-2" id="recompose-feedbacklevel">
      <button class="bt-feedback btn btn-warning"><i class="bi bi-eye-fill"></i> Feedback <span class="count"></span></button>
      <button class="bt-clear-feedback btn btn-warning"><i class="bi bi-eye-slash-fill"></i> Clear Feedback</button>
    </div>
    <div class="btn-group btn-group-sm ms-2">
      <button class="bt-submit btn btn-danger"><i class="bi bi-send"></i> Submit <span class="count"></span></button>
    </div>
    <div class="flex-fill">&nbsp;</div>
    <span></span>
  </div>
  <div class="d-flex flex-fill align-items-stretch p-2">
    <div class="kb-container d-flex flex-fill flex-column border bg-white rounded">
      <div class="kb-toolbar p-1 d-flex align-items-center justify-content-between bg-light border-bottom">
        <span class="left-stack"></span>
        <span class="center-stack"><span class="btn btn-sm">&nbsp;</span></span>
        <span class="right-stack"></span>
      </div>
      <div id="recompose-canvas" class="kb-cy flex-fill"></div>
    </div>
    <?php // $this->pluginView('kitbuild-ui', ["id" => "recompose-canvas"], 0); ?>
  </div>
  <div class="d-flex">
    <div class="status-panel flex-fill m-2 mt-0 d-flex" style="overflow-x: auto"></div>
    <div class="status-control text-end m-2 mt-0"><button class="btn btn-primary btn-sm opacity-0">&nbsp;</button></div>
  </div>
</div>
    
<form id="concept-map-open-dialog" class="card d-none">
  <h6 class="card-header"><i class="bi bi-folder2-open"></i> Open Kit</h6>
  <div class="card-body">
    <div class="px-3 pb-3">
      <input type="text" class="form-control" name="id" placeholder="Enter your name or ID" />
    </div>

    <div class="px-3">
      <input type="text" class="form-control" name="url" placeholder="Enter concept map data URL here" />
    </div>

    <hr>

    <div class="px-3">
      <div class="file-drop-area">
        <span class="fake-btn btn btn-primary me-3">Choose file</span>
        <span class="file-msg">or drop file here</span>
        <input class="file-input" type="file" multiple>
        <div class="item-delete me-4"></div>
      </div>
    </div>

  </div>
  <div class="card-footer">
    <div class="row">
      <div class="col text-end">
        <button class="bt-cancel btn btn-sm btn-secondary" style="min-width: 6rem;"><?php echo Lang::l('cancel'); ?></button>
        <button class="bt-open btn btn-sm btn-primary ms-1" style="min-width: 6rem;">
          <i class="bi bi-folder2-open"></i> <?php echo Lang::l('open'); ?></button>
      </div>
    </div>
  </div>
</form>

<div id="kit-export-dialog" class="card d-none">
  <h6 class="card-header"><i class="bi bi-send"></i> Export</h6>
  <div class="card-body">
    <textarea class="form-control encoded-data" rows="5"></textarea>
  </div>
  <div class="card-footer text-end">
    <button class="btn btn-sm btn-secondary bt-cancel px-3"><?php echo Lang::l('cancel'); ?></button>
    <button class="btn btn-sm btn-primary ms-1 bt-clipboard px-3"><i class="bi bi-clipboard"></i> Copy to Clipboard</button>
  </div>
</div>

<div id="kit-content-dialog" class="card d-none">
  <h6 class="card-header d-flex">
    <span class="drag-handle flex-fill"><i class="dialog-icon bi bi-file-text"></i> <span class="dialog-title">Content</span></span>
    <i class="bi bi-x-lg bt-close bt-x" role="button"></i>
  </h6>
  <div class="card-body position-relative overflow-hidden overflow-scroll d-flex flex-fill mb-3">
    <div class="content text-secondary"></div>
  </div>
  <div class="card-footer d-flex justify-content-between align-items-center">
    <span>
      <span class="bt-scroll-top btn btn-sm ms-1 btn-primary px-3"><i class="bi bi-chevron-bar-up"></i> Back to Top</span>
      <span class="bt-scroll-more btn btn-sm ms-1 btn-primary px-3"><i class="bi bi-chevron-down"></i> More</span>
    </span>
    <span>
      <button class="btn btn-sm btn-secondary bt-close px-3"><?php echo Lang::l('close'); ?></button>
      <button class="btn btn-sm resize-handle pe-0 ps-3"><i class="bi bi-textarea-resize"></i></button>
    </span>
  </div>
</div>

<div id="feedback-dialog" class="card d-none">
  <h6 class="card-header d-flex">
    <span class="drag-handle flex-fill"><i class="dialog-icon bi bi-eye-fill me-2"></i> <span class="dialog-title">Quick Feedback</span></span>
    <i class="bi bi-x-lg bt-close bt-x" role="button"></i>
  </h6>
  <div class="card-body">
    <div class="feedback-content"></div>
  </div>
  <div class="card-footer text-end">
    <button class="btn btn-sm btn-secondary bt-cancel bt-close px-3"><?php echo Lang::l('ok'); ?></button>
    <button class="btn btn-sm btn-primary bt-modify px-3 ms-1">Modify My Map</button>
  </div>
</div>
