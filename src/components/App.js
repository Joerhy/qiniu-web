import { Alert, Badge, Button, Breadcrumb, Checkbox,  Icon, Switch, Affix, Spin, Row, Col, Select, message} from 'antd';
import QueueAnim from 'rc-queue-anim'
import reqwest from 'reqwest';
import moment from 'moment';
import classname from 'classname';
import QiniuCard from './QiniuCard';
import QiniuFolder from './QiniuFolder';
import QiniuPreview from './QiniuPreview';
import QiniuUploader from './QiniuUploader';
import QiniuBatch from './QiniuBatch';
const Option = Select.Option;
let QiniuList = React.createClass({

    getInitialState() {
        let buckets = window.INIT_DATA.buckets;
        let initBucket = '';
        for(let item in buckets){
            if(initBucket == ''){
                initBucket = item;
            }
        }
        return {
            loading: true,
            edit: false,
            buckets: buckets || {},
            bucket: initBucket,
            date: moment().format('YYYY-MM-DD'),
            prefix: "",
            ret: {
                items: [],
                commonPrefixes: []
            },
            selectItem : {}   ,
            selectKeys:[], //多选模式 key数组
            random: new Date().getTime(),
            error: false,
        };
    },

    changeCheckAll(e){
        var selectKeys = this.state.selectKeys;
        if(e.target.checked){
            this.state.ret.items.map(item=>{
                let index = selectKeys.indexOf(item.key);
                if( index == -1){
                    selectKeys.push(item.key);
                }
            });
        }else{
            selectKeys = [];
        }

        this.setState({
            selectKeys
        });
    },

    handleSelectAll(){
        var selectKeys = this.state.selectKeys;
        this.state.ret.items.map(item=>{
            let index = selectKeys.indexOf(item.key);
            if( index == -1){
                selectKeys.push(item.key);
            }
        });
        this.setState({
            selectKeys
        });
    },

    handleCancelAll(){

        var selectKeys = this.state.selectKeys;
        this.state.ret.items.map(item=>{
            let index = selectKeys.indexOf(item.key);
            if( index > -1){
                selectKeys.splice(index, 1);
            }
        });
        this.setState({
            selectKeys
        });
    },

    componentWillMount () {
        var bucket = decodeURIComponent((location.hash.split('#')[1] || ':').split(':')[0]);
        var prefix = decodeURIComponent((location.hash.split('#')[1] || ':').split(':')[1]);

        this.fetchData( prefix || '', bucket || this.state.bucket)
        
    },


    toggleEdit(checked){
        this.setState({
            edit: checked,
            selectItem : {},
            selectKeys:[]
        });
    },

    fetchFather(){
        this.fetchData(  this.getParentsPrefix(this.state.prefix)[1] );
    },

    handleClickReload(){
        this.reloadData();
    },

    reloadData(){
        this.fetchData(this.state.prefix);
    },


    fetchData(prefix = '', bucket = this.state.bucket){
        // console.log(prefix, bucket);
        this.setState({loading: true  });
        reqwest({
            url:'/api/list',
            method: 'get',
            data: {
                bucket: bucket,
                prefix:  prefix
            },
            crossOrigin: true,
            type: 'json',
            error: (err) => {
                message.error('加载失败');
                this.setState({
                    loading: false,
                    error: true,
                    ret: {
                        items: [],
                        commonPrefixes: []
                    },
                })
            },
            success: (result) => {
                location.hash = encodeURIComponent(this.state.bucket) + ':' + encodeURIComponent(prefix);
                if(result.success){
                    this.setState({
                        loading: false,
                        bucket: bucket,
                        ret: result.ret,
                        prefix: result.prefix,
                        domain: result.domain,
                        error: false,
                        selectItem:{},  //单选模式
                        random: new Date().getTime()

                    })
                }else{
                    message.error('加载失败',2);
                    this.setState({
                        loading: false,
                        error: true,
                        ret: {
                            items: [],
                            commonPrefixes: []
                        },
                    })
                }


            }
        });
    },


    getParentsPrefix(str){
        var str2 =  str.replace(/(.*)(\/.+)/g, "$1");
        if(str2 == str){
            return [str.split('/')[0],''];
        }else{
            return [str.split(str2 + '/')[1].split('/')[0], str2 + '/'];
        }
    },

    getAllParentsPrefixArray(str){
        var result = [];
        while( str.length > 0){
            var parent = this.getParentsPrefix(str);
            result.unshift([parent[0],str]);
            str = parent[1];
        }

        result.unshift(['根目录','']);
        return result;
    },

    handleChangeBucket(value){
       this.fetchData('', value);

    },

    handleSelect(item){
        if(this.state.edit){
            //编辑模式
            var selectKeys = this.state.selectKeys;
            let index = selectKeys.indexOf(item.key);
            if( index == -1){
                selectKeys.push(item.key);
            }else{
                selectKeys.splice(index, 1)
            }
            this.setState({
                selectKeys: selectKeys
            })
        }else{
            //单选模式
            if(this.state.selectItem.key == item.key){
                this.setState({
                    selectItem: {}
                })
            }else{
                this.setState({
                    selectItem: item
                });
            }
        }
    },

    render () {
        const breadcrumbArray =   this.getAllParentsPrefixArray(this.state.prefix);


        const breadcrumb = breadcrumbArray.map(item=>{
            return  <Breadcrumb.Item href="javascript:void(0)" key={item[0]} onClick={this.fetchData.bind(this, item[1], this.state.bucket)}>{item[0]}</Breadcrumb.Item>
        });

        let buckets = [];
        for(let item in this.state.buckets){
            buckets.push( {bucket: item, domain: this.state.buckets[item] })
        }

        breadcrumb.unshift(
            <Breadcrumb.Item href="javascript:void(0)" key="buckets">
                <Select value={this.state.bucket} style={{ minWidth: 120 }} size="small" onChange={this.handleChangeBucket}>
                    {   buckets.map(item=>{
                        return <Option key={item.bucket}><Icon type="hdd" /> {item.bucket}</Option>
                        })
                    }
                </Select>
            </Breadcrumb.Item>
        );


        const headerClass = classname({
            'ant-layout-header': true,
            'edit': this.state.edit
        });

        return <div className="ant-layout-aside">
            <div className={headerClass}>
                <span>七牛文件管理工具</span>

                <ul className="right">
                    <li>{this.state.date}</li>
                    <li>|</li>
                    <li>
                        <a href="https://portal.qiniu.com" target="_blank">  <Icon type="cloud" /> </a>
                    </li>

                </ul>
            </div>

            <div  className="ant-layout-main">
                { this.state.error ?
                <Row >
                    <Col className="gutter-row" offset={4} span={16}>
                        <Alert
                            message="配置错误"
                            description="请检查秘钥,空间名是否正确! "
                            type="error"
                            showIcon
                        />
                    </Col>
                </Row>
                    :
                <Row >
                    <Col className="gutter-row" offset={1} span={16}>

                        <Row>
                            <Col span={14} style={{paddingLeft:10}}>
                                <Breadcrumb >
                                    {breadcrumb}
                                </Breadcrumb>

                            </Col>
                            <Col span={9}  style={{paddingLeft:10,textAlign:'right'}}>
                                {this.state.edit ? <span>
                                    <a  onClick={this.handleSelectAll} href="javascript:void(0)">本页全选</a>
                                    <span> | </span>
                                    <a  onClick={this.handleCancelAll} href="javascript:void(0)">清除选择</a>
                                </span> : null} <Switch size="small" defaultChecked={false} onChange={this.toggleEdit} /> 批处理 | <a  onClick={this.handleClickReload} href="javascript:void(0)"><Icon type="reload" /> 刷新</a>
                            </Col>
                        </Row>

                        <div>
                                {
                                    this.state.prefix == '' ?  <QiniuFolder key="1" disabled folder={this.state.bucket} type="open"/>:
                                        <QiniuFolder key="1" folder={'返回上级'} onClick={this.fetchFather} type="open"/>
                                }

                                {
                                    this.state.ret.commonPrefixes ? this.state.ret.commonPrefixes.map( folder =>{
                                        return <QiniuFolder  key={folder}  onClick={this.fetchData.bind(this, folder)} folder={folder} />

                                    }): null

                                }
                                {
                                    this.state.ret.items.map( item =>{
                                        return <QiniuCard checked={
                                        this.state.edit ?(
                                            this.state.selectKeys.indexOf(item.key)>=0
                                        ):  item.key == this.state.selectItem.key
                                        } onClick={this.handleSelect} domain={this.state.domain} key={'item_'+item.key} item={item} random={this.state.random}/>
                                    })

                                }
                        </div>
                    </Col>
                    <Col className="gutter-row" span={6} style={{paddingTop:10}}>

                        <QiniuUploader bucket={this.state.bucket}
                                       prefix={this.state.prefix}
                                       onSuccess = {this.reloadData}
                        />

                        <Affix offsetTop={10}>
                            {
                                this.state.edit?
                                <QiniuBatch key={this.state.selectItem.key}  onSuccess = {this.reloadData} bucket={this.state.bucket} prefix={this.state.prefix}  domain={this.state.domain} keys={this.state.selectKeys}/>
                                :
                                <QiniuPreview key={this.state.selectItem.key} random={this.state.random}  onSuccess = {this.reloadData} bucket={this.state.bucket}  prefix={this.state.prefix}   domain={this.state.domain} item={this.state.selectItem}/>
                            }
                        </Affix>


                    </Col>
                </Row>
                }

            </div>
        </div>
    }
});

module.exports = QiniuList;
