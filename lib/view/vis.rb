#require 'vis'
require 'pio'

module View
  # Topology controller's GUI (vis).
  class VisJs

    def initialize(output = 'lib/view/topology.txt')
      @output = output
    end

    def update(_event, _changed, topology)
      # write node data
      File.open(@output, "w") do |file|
        
        #switch
        nodes = topology.switches.each_with_object({}) do |each, tmp|
          file.printf("%d Switch:%d\n",each.to_i, each.to_i)
        end
        #host
        file.printf("host\n")
        topology.hosts.each do |each|  #for all host
          file.printf("%d Host:%d\n",each[1].to_i, each[1].to_i)
        end

        @temp = Hash.new { [] }#check link
        #link of switches
        file.printf("link\n")
        topology.links.each do |each|
          if checkLinkList(@temp,each.dpid_a.to_i,each.dpid_b.to_i )==true then
            file.printf("%d %d\n",each.dpid_a.to_i, each.dpid_b.to_i)
            @temp[each.dpid_a.to_i].push(each.dpid_b.to_i)
          end
        end
        #link between host and switch
        topology.hosts.each do |each|  #for all host
          if checkLinkList(@temp,each[1].to_i,each[2].to_i )==true then
            file.printf("%d %d\n",each[1].to_i, each[2].to_i)
            @temp[each[1].to_i].push(each[2].to_i)
          end
        end

      end
      
    end

    private
    
    def checkLinkList(getList, a, b)
      getList.each_key do |key|
        getList[key].each do |each|
          if (each == a && key==b) || (each == b && key==a) then
            return false
          end
        end
      end
      return true
    end
    
  end
end
