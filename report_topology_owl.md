#情報ネットワーク学演習II 11/9 レポート課題
===========
チーム名　owl  
メンバー 秋下 耀介、坂田 航樹、坂本 昂輝、佐竹 幸大、田中 達也、Jens Oetjen、齊藤 卓哉  

## 役割分担
* 実機スイッチの設定、実行　田中 (、秋下)
* 課題2のプログラム作成　坂本、秋下
* 課題1のレポート作成　田中
* 課題2のレポート作成　坂本、秋下

## 課題１ (実機でトポロジを動かそう)

1. 実機スイッチ上に VSI x16 を作成 (各VSIは2ポート以上)
1. 全ポートを適当にケーブリング
1. Topologyを使ってトポロジを表示
1. ケーブルを抜き差ししてトポロジ画像が更新されることを確認  

レポートには次のことを書いてください。

* 表示できたトポロジ画像。何パターンかあると良いです
* ケーブルを抜き差ししたときの画像
* 実機スイッチのセットアップ情報。作業中の写真なども入れるとグーです


### 解答
#### 実機スイッチのセットアップ
本課題を取り組んだ際のセットアップについて記述する。
スイッチの初期設定は前回までに終了していたので、設定用端末設定から行った。

まず、コントローラーとして用いる端末で
```
$ sudo ip addr add 192.168.1.2/24 dev eth0
```
を入力した。
この際IPアドレスはPF5240のマネジメントポートと同じサブネットに属さなければならない。
この際、ネットワークを接続する必要がある。
うまく実行できなかったため、先生の助言の元、Ubuntuの「ネットワーク接続を編集する」から手動でIPアドレスを割り当てた。

続いて、設定用端末のVMよりtelnetでPF5240にアクセスするために以下のコマンドを入力する。
```
$ telnet 192.168.1.1
```
このIPアドレスは実機のIPアドレスである。
コンフィグレーションコマンドモードでVSIを作成する。
VSIは16個作成する。

まずVLAN定義を行う。
```
(config)# vlan <VLAN id>
(config-vlan)# exit
```
その後、インスタンス作成を行う。
```
(config)# openflow openflow-id <VSI id> virtual-switch
(config-of)# controller controller-name cntl1 1 <IP address of controller> port 6653
(config-of)# dpid <dpid>
(config-of)# openflow-vlan <VLAN id>
(config-of)# miss-action controller
(config-of)# enable
(config-of)# exit
```
各変数には以下の値を入力した。
* <VLAN id> : 100,200,・・・,1600
* <VSI id> : 1,2,・・・,16
* <IP address of controller> : 192.168.1.2
* <dpid> : 0000000000000001,0000000000000002,・・・,0000000000000016

```
(config-of)# openflow-vlan <VLAN id>
```
を実行する際に、
```
!(config-of)# openflow-vlan 100
openflow : Can't set because the OpenFlow instance is enabled.
```
というエラーが出現した。
これは既に VSI (OpenFlow スイッチのインスタンス) が
enable 状態になっているため、設定変更できないという旨のエラーである。
そこで、
```
(config-of)# no enable
(config-of)# openflow-vlan <VLAN id>
(config-of)# enable
```
と入力することにより、VSIを一旦disableにしてから設定を行い、enable状態にする。

続いて作成した各VSIにポートをマップする。
```
(config)# interface range gigabitethernet 0/<from_port>-<to_port>
(config-interface)# switchport mode dot1q-tunnel
(config-interface)# switchport access vlan <VLAN id>
```
今回VSIは16個であり、実機のポートは48個であったので、各VSIに3ポートずつマップした。

以上の設定が終了したあと、
```
(config)# save
```
で設定の有効化を行った。

#### 実行結果
まず、実機ポートの接続画像を以下に示す。
![](switch1.jpg)
このポート接続に対して、
```
$ ./bin/trema run ./lib/topology_controller.rb　-- graphviz /tmp/topology.png
```
でトポロジ画像を出力した。
graphvizはapt-getでインストールする必要がある。
この時、ネットワーク設定を変更する必要がある。(実機と接続するためのネットワーク設定のままではインストールできない。)
出力したトポロジ画像は以下である。
![](topology.png)

続いて、実機ポートのケーブルを適当に抜き差しし、接続を変更した
この際の、実機ポートの接続画像を以下に示す。
![](switch2.jpg)
```
$ ./bin/trema run ./lib/topology_controller.rbf -- graphviz /tmp/topology2.png
```
と入力して、トポロジ画像を出力した。
出力したトポロジ画像は以下である。
![](topology2.png)
トポロジ画像が変更されていることがわかる。

さらに実機ポートのケーブルを適当に抜き差しし、接続を変更した場合のトポロジ画像を以下に示す。
![](topology3.png)

## 課題2 (トポロジコントローラの拡張)
* スイッチの接続関係に加えて、ホストの接続関係を表示する
* ブラウザで表示する機能を追加する。おすすめは vis.js です

### 実装
本機能の実装にあたり、実装を以下の２つに切り分けた。
* トポロジ情報の取得（プログラムの解読）およびテキストファイル出力(担当：秋下)
* テキスト情報に基づいたvis.jsによるトポロジの表示（担当：坂本）
それぞれについての説明を以下に示す。


#### トポロジ情報のテキストファイル出力
ここでは、配布されたtopology.rbなどに変更を加え、トポロジ情報の出力を行う。
次節で実際にトポロジの出力を行うが、そのための入力テキストファイルとして、lib/view/配下に以下のようなテキストファイルを作成するものとした。
ノード情報（スイッチ、ホスト）は、
```
1	Switch:1
2	Switch:2
...
10	Switch:10
host
11	Host:11
12	Host:12
...
```
のようになっており、１列目がID、２列目がラベルを表している。今回はスイッチとホストの区別を行うために、区切り文字として「host」を書き込んでいる。
また、リンク情報は、
```
...
link
1	4
2	8
...
15	3
16	4
```
のようになっており、１列目が送信元ノードのID、２列目が宛先ノードのIDを表している。すなわち、そのノード同士が接続されていることが読み取れるようになっている。ただし、無向グラフとして定義してる。ここでは、リンク情報の前にノード情報が記述されているため、区切り文字として「link」を書き込んでいる。

上記のようなファイルを出力するにあたって、まず以下のファイルを新規作成した。
* lib/view/vis.rb

また、以下の2つのファイルに変更を加えた。
* lib/topology.rb
* lib/command_line.rb

それぞれについて説明を行う。

##### lib/view/vis.rb
ここでは、トポロジの情報を実際にファイルとして書き出すメソッド等を実装した。
まず以下のように初期化メソッドを定義することで、出力ファイルはデフォルトでlib/view配下に作成するものとした。
```
def initialize(output = 'lib/view/node.txt',output2 = 'lib/view/link.txt')
      @output = output
      @output2 = output2
end
```

次に、テキストファイルへの書き出しを行うメソッドは以下のような実装とした。
```
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
```
上記では、まずnode.txtへの出力を行い、その後link.txtへの出力を行っている。node.txtに対しての書き込みでは、各スイッチおよび各ホストの要素をひとつずつ確認していく。
ここでノードの情報はそのノードIDがいくつであるかのみ分かれば良いため、IDおよびそのIDを用いたラベルを書き込む。
同様に、link.txtに対しての書き込みでは、各リンクの要素をひとつずつ確認する。このとき、checkListメソッドがtrueであれば、実際に書き込みを行う。そして、書き込んだ内容を@tempに保存する。ここで、linksにはスイッチ間のリンク情報しか保存されていないため、hostの要素をひとつずつ確認し、ホスト--スイッチ間のリンクも追加する。ただしこの時も同様に、checkListメソッドがtrueであれば書き込みを行う。

checkLinkListメソッドは、すでにファイルに書き込んだ内容および、今書き込もうとしている内容が重なってないかを判断するメソッドで、以下のようになっている。
```
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
```
上記は、まずgetListの各キーを取得し、それらを用いて実際に保存されいてる各配列要素を確認していくものとなっている。そして、キーと配列要素が一致していた場合は、すでに書き込みが終わっている要素の組み合わせであるから、falseを返す。もし保存された要素の中に存在しなかった場合はtrueを返す。

##### lib/topology.rb
```

```


```

```


```

```

##### lib/command_line.rb
ここでは、コマンドラインから今回実装したテキストファイルへの出力コマンドを実装できるよう、`define_graphviz_command`メソッドを参考にして以下のメソッドを追加した。
```
  def define_vis_command
    desc 'Displays topology information (vis mode)'
    arg_name 'output_file'
    command :vis do |cmd|
      cmd.action(&method(:create_vis_view))
    end
  end
```
また、合わせてparseメソッドに上記メソッドを書き込んだ。そして`create_graphviz_view`と同様にして以下のprivateメソッドを定義した。
```
def create_vis_view(_global_options, _options, args)
    require 'view/vis.rb'
    if args.empty?
      @view = View::VisJs.new
    else
      @view = View::VisJs.new(args[0])
    end
 end
```
これによって、vis.rbが表示形式として選択されるようになる。



#### vis.jsによるトポロジの表示

### 実行結果



## メモ
実機の設定は前回の設定が残っている。
showコマンドで設定情報を確認すること。
設定用端末のネットワーク設定を逐一確認すること。


##参考文献
- デビッド・トーマス+アンドリュー・ハント(2001)「プログラミング Ruby」ピアソン・エデュケーション.  
- [テキスト: 15章 "ネットワークトポロジを検出する"](http://yasuhito.github.io/trema-book/#topology)  
