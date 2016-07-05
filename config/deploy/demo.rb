server '162.243.123.227', :user => 'undg', :roles => %{web app}

  set :deploy_to, '/home/undg/stage'
  set :shared_path, '/home/undg/stage/shared/'