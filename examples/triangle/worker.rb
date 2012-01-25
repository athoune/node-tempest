require 'tempest'

tempest do
  worker :working do

    on :something_long do |context, what, who|
      context.answer "#{what} #{who} from Ruby"
    end

  end.start_loop
end
