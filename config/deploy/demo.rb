server '128.199.73.92', :user => 'dportal', :roles => %{web app}

  set :deploy_to, '/home/dportal/demo'
  set :shared_path, '/home/dportal/demo/shared/'