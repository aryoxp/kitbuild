<div class="app-navbar d-flex p-2 border-bottom">  
  <button class="bt-open btn btn-sm btn-primary"><i class="bi bi-folder2-open"></i> Open Concept Map</button>
  <button class="bt-teacher-map btn btn-sm btn-secondary ms-2"><i class="bi bi-person-video3"></i> Teacher Map</button>
  <button class="bt-student-map btn btn-sm btn-secondary ms-2"><i class="bi bi-person-video2"></i> Student Map</button>
  <button class="bt-compare-map btn btn-sm btn-success ms-2"><i class="bi bi-intersect"></i> Compare Map</button>
</div>

<div class="d-flex flex-fill align-items-stretch">
  <div class="analyzer-sidebar d-flex flex-column" style="flex-basis: 280px">
    <div class="px-1 ps-2 d-flex align-items-center my-1">
      <small>Kit</small>
      <select name="kid" id="select-kid" class="form-select form-select-sm ms-2">
        <option class="default">All Kits</option>
      </select>
    </div>
    <div class="d-flex align-items-center p-1 border-bottom text-smaller justify-content-end">
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-auto"> <label for="cb-lm-auto" class="mx-1">Autosave</label>
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-draft"> <label for="cb-lm-draft" class="mx-1">Draft</label>
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-feedback"> <label for="cb-lm-feedback" class="mx-1">Feedback</label>
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-fix" checked> <label for="cb-lm-fix" class="mx-1">Submitted</label>
    </div>
    <div class="d-flex align-items-center p-1 border-bottom text-smaller justify-content-end">
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-all"> <label for="cb-lm-all" class="mx-1">All</label>
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-first"> <label for="cb-lm-first" class="mx-1">First</label>
      <input type="checkbox" class="cb-score ms-1" id="cb-lm-last" checked> <label for="cb-lm-last" class="mx-1">Last</label>
    </div>
    <div class="d-flex justify-content-between align-items-center p-1 border-bottom text-smaller">
      <span>
        <span class="ms-1">Concept Map</span>
        <span class="ms-2 bt-download-xlsx" role="button">
          <i class="bi bi-download text-primary"></i>
          <span class="btn-link">Download (XLSX)</span>
        </span>
      </span>
      <span class="d-flex align-items-center">
        <input type="checkbox" id="cb-lm-score" class="me-1">
        <label for="cb-lm-score" class="me-1" role="button">Score</label>
      </span>
    </div>
    <!-- <div id="list-learnermap" class="text-smaller flex-fill bg-white overflow-scroll p-2">
    </div> -->
    <div class="flex-fill d-flex position-relative align-items-stretch">
      <div id="list-learnermap" class="bg-white position-absolute h-100 w-100 text-smaller scroll-y">
      </div>
    </div>
    <div id="group-map-tools">
      <div class="p-2">
        <button class="bt-group-map btn btn-sm btn-primary">Group Map</button>
        <small class="ms-4">Range: <span id="min-max-range" class="fw-bold text-primary">0 ~ 0</span></small>
      </div>
      <div class="p-2 pt-0">
        <span class="d-flex align-items-center">
          <span class="text-smaller text-center" style="flex-basis: 45px">Min</span>
          <input type="range" class="form-range" id="group-min-val" min="0" max="0">
          <span class="text-smaller text-center" id="group-min-val-label" style="flex-basis: 35px">0</span>
        </span>
        <span class="d-flex align-items-center">
          <span class="text-smaller text-center" style="flex-basis: 45px">Max</span>
          <input type="range" class="form-range" id="group-max-val" min="0" max="0">
          <span class="text-smaller text-center" id="group-max-val-label" style="flex-basis: 35px">0</span>
        </span>
      </div>
    </div>
  </div>
  <div class="d-flex flex-fill align-items-stretch">
    <?php $this->pluginView('kitbuild-ui', ["id" => "analyzer-canvas"], 0); ?>
  </div>
</div>






<form id="concept-map-open-dialog" class="card d-none">
  <h6 class="card-header"><i class="bi bi-folder2-open"></i> Open Concept Map</h6>
  <div class="card-body">
    <div class="row gx-2 mb-1">
      <div class="col d-flex">
        <span class="border-bottom px-2 py-1 flex-fill position-relative">Topic</span></div>
      <div class="col d-flex">
        <span class="border-bottom px-2 py-1 flex-fill position-relative">Concept Map</span></div>
    </div>
    <div class="row gx-2 mb-3">
      <div class="col list list-topic">
        <span class="topic list-item default" data-tid="">
          <em>Unassigned</em><bi class="bi bi-check-lg text-primary"></bi>
        </span>
      </div>
      <div class="col list list-concept-map"></div>
    </div>
    <div class="badge rounded-pill bg-secondary bt-refresh-topic-list" role="button">Refresh Topic List</div>
  </div>
  <div class="card-footer">
    <div class="row">
      <div class="col text-end">
        <button class="bt-cancel btn btn-sm btn-secondary" style="min-width: 6rem;"><?php echo Lang::l('cancel'); ?></button>
        <button class="bt-open btn btn-sm btn-primary ms-1" style="min-width: 6rem;"><?php echo Lang::l('open'); ?></button>
      </div>
    </div>
  </div>
</form>




<div id="proposition-dialog" class="card d-none">
  <h6 class="card-header d-flex">
    <span class="drag-handle flex-fill"><i class="dialog-icon bi bi-bezier me-2"></i> <span class="dialog-title">Propositions</span></span>
    <i class="bi bi-x-lg bt-close bt-x" role="button"></i>
  </h6>
  <div class="card-body">
    <div class="proposition-list"></div>
  </div>
  <div class="card-footer text-end">
    <button class="btn btn-sm btn-secondary bt-close px-5"><?php echo Lang::l('ok'); ?></button>
  </div>
</div>

<div id="proposition-author-dialog" class="card d-none">
  <h6 class="card-header d-flex">
    <span class="drag-handle flex-fill"><i class="dialog-icon bi bi-bezier me-2"></i> <span class="dialog-title">Proposition Authors</span></span>
    <i class="bi bi-x-lg bt-close bt-x" role="button"></i>
  </h6>
  <div class="card-body">
    <div class="author-list scroll-y" style="max-height: 150px;"></div>
  </div>
  <div class="card-footer text-end">
    <button class="btn btn-sm btn-secondary bt-close px-5"><?php echo Lang::l('ok'); ?></button>
  </div>
</div>