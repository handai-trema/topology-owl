#情報ネットワーク学演習II 11/9 レポート課題
===========
チーム名　owl  
メンバー 秋下 耀介、坂田 航樹、坂本 昂輝、佐竹 幸大、田中 達也、Jens Oetjen、齊藤 卓哉  

## 役割分担
* 実機スイッチの設定、実行　田中、秋下
* 課題2のプログラム作成　坂本
* 課題1のレポート作成　田中

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

### 実行結果



## メモ
実機の設定は前回の設定が残っている。
showコマンドで設定情報を確認すること。
設定用端末のネットワーク設定を逐一確認すること。


##参考文献
- デビッド・トーマス+アンドリュー・ハント(2001)「プログラミング Ruby」ピアソン・エデュケーション.  
- [テキスト: 15章 "ネットワークトポロジを検出する"](http://yasuhito.github.io/trema-book/#topology)  
