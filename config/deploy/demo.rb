server '188.166.155.208', :user => 'undg', :roles => %{web app}

  set :deploy_to, '/home/undg/demo'
  set :shared_path, '/home/undg/stage/shared/'