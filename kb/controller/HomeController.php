<?php

class HomeController extends CoreController {
  
  function index($seq = null) {
    // $host = Core::lib(Core::CONFIG)->get('default_collab_host');
    // $port = Core::lib(Core::CONFIG)->get('default_collab_port');
    // Core::lib(Core::CONFIG)->set('collabhost', $host, CoreConfig::CONFIG_TYPE_CLIENT);
    // Core::lib(Core::CONFIG)->set('collabport', $port, CoreConfig::CONFIG_TYPE_CLIENT);
    // Core::lib(Core::CONFIG)->set('seq', $seq ?? 0, CoreConfig::CONFIG_TYPE_CLIENT);
    $this->ui->useCoreLib('core-ui');
    // $this->ui->useCoreClients();
    $this->ui->usePlugin('core-runtime');
    $this->ui->usePlugin('kitbuild-ui', 'kitbuild', 'kitbuild-analyzer', 'kitbuild-logger', 'kitbuild-collab', 'general-ui', 'highlight', 'showdown');
    $this->ui->useScript("recompose.js");
    $this->ui->useStyle("recompose.css");
    
    $this->ui->view('head.php', null, CoreView::CORE);
    $this->ui->view("recompose.php");
    // $this->ui->pluginView("general-ui", null, 0);
    $this->ui->view('foot.php', null, CoreView::CORE);
  }

}