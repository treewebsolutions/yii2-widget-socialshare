<?php

namespace tws\widgets\socialshare;

use yii\web\AssetBundle;

class SocialShareAsset extends AssetBundle
{
	/**
	 * @inheritdoc
	 */
	public $css = [
		'css/yii.social-share.css',
	];

	/**
	 * @inheritdoc
	 */
	public $js = [
		'js/yii.social-share.js',
	];

	/**
	 * @inheritdoc
	 */
	public $depends = [
		'yii\web\JqueryAsset',
	];

	/**
	 * @inheritdoc
	 */
	public function init()
	{
		parent::init();

		$this->sourcePath = __DIR__ . '/assets';
	}
}
