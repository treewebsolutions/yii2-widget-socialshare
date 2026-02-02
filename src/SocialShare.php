<?php

namespace tws\widgets\socialshare;

use Yii;
use yii\base\InvalidConfigException;
use yii\helpers\ArrayHelper;
use yii\helpers\Html;
use yii\helpers\Json;
use yii\web\JsExpression;
use yii\web\View;

/**
 * Class SocialShare
 *
 * @author Tree Web Solutions <treewebsolutions.com@gmail.com>
 */
class SocialShare extends \yii\base\Widget
{
	const FACEBOOK = 'facebook';
	const TWITTER = 'twitter';
	const LINKEDIN = 'linkedin';
	const PINTEREST = 'pinterest';

	/**
	 * @var array The social networks.
	 */
	public $socialNetworks = [];

	/**
	 * @var array The container options.
	 */
	public $containerOptions = [];

	/**
	 * @var array The social share options.
	 */
	public $options = [];

	/**
	 * @var array The client (JS) options.
	 */
	public $clientOptions = [];

	/**
	 * @var array The client (JS) events.
	 */
	public $clientEvents = [];

	/**
	 * @var string The client (JS) selector.
	 */
	private $_clientSelector;

	/**
	 * @var string The global widget JS hash variable.
	 */
	private $_hashVar;

	/**
	 * @inheritdoc
	 * @throws \yii\base\InvalidConfigException
	 */
	public function init()
	{
		parent::init();

		if (!is_array($this->socialNetworks)) {
			throw new InvalidConfigException('The "socialNetworks" property must be an array.');
		}

		$this->setupProperties();
		$this->registerAssets();

		ob_start();
	}

	/**
	 * @inheritdoc
	 */
	public function run()
	{
		$content = ob_get_clean();

		if (!empty($this->socialNetworks)) {
			$content = Html::ul($this->renderItems(), $this->options);
		}

		return Html::tag('div', $content, $this->containerOptions);
	}

	/**
	 * Renders the items.
	 *
	 * @return array
	 */
	protected function renderItems()
	{
		$items = [];
		$buttonOptions = ArrayHelper::remove($this->options['itemOptions'], 'buttonOptions', []);
		$buttonTag = ArrayHelper::remove($buttonOptions, 'tag', 'button');

		foreach ($this->socialNetworks as $key => $socialNetwork) {
			if ($socialNetwork['enabled'] === false) {
				continue;
			}
			$socialNetworkOptions = [
				'data' => [
					'social-network' => $key,
				],
			];
			$items[] = Html::tag($buttonTag, $socialNetwork['icon'], array_merge($buttonOptions, $socialNetworkOptions));
		}

		return $items;
	}

	/**
	 * Gets the client selector.
	 *
	 * @return string
	 */
	public function getClientSelector()
	{
		if (!$this->_clientSelector) {
			$this->_clientSelector = '#' . $this->getId();
		}
		return $this->_clientSelector;
	}

	/**
	 * Gets the hash variable.
	 *
	 * @return string
	 */
	public function getHashVar()
	{
		if (!$this->_hashVar) {
			$this->_hashVar = 'socialshare_' . hash('crc32', $this->buildClientOptions());
		}
		return $this->_hashVar;
	}

	/**
	 * Sets the widget properties.
	 */
	protected function setupProperties()
	{
		$this->containerOptions = array_merge([
			'id' => $this->getId(),
			'class' => 'social-share-container',
			'data' => [
				'socialshare-options' => $this->getHashVar(),
			],
		], $this->containerOptions);
		Html::addCssClass($this->containerOptions, 'social-share-container');
		$this->containerOptions['data']['socialshare-options'] = $this->getHashVar();
		if ($this->containerOptions['id']) {
			$this->setId($this->containerOptions['id']);
		}

		$this->options = array_merge([
			'encode' => false,
			'class' => 'social-share-items',
			'itemOptions' => [
				'class' => 'social-share-item',
				'buttonOptions' => [
					'tag' => 'button',
					'type' => 'button',
					'class' => 'social-share-button',
				],
			],
		], $this->options);
		Html::addCssClass($this->options, 'social-share-items');
		Html::addCssClass($this->options['itemOptions'], 'social-share-item');
		Html::addCssClass($this->options['itemOptions']['buttonOptions'], 'social-share-button');
		$this->options['encode'] = false;

		$this->socialNetworks = array_replace_recursive([
			self::FACEBOOK => [
				'enabled' => true,
				'icon' => '<span class="fa fa-facebook"></span>',
			],
			self::TWITTER => [
				'enabled' => true,
				'icon' => '<span class="fa fa-twitter"></span>',
			],
			self::LINKEDIN => [
				'enabled' => true,
				'icon' => '<span class="fa fa-linkedin"></span>',
			],
			self::PINTEREST => [
				'enabled' => true,
				'icon' => '<span class="fa fa-pinterest"></span>',
			],
		], $this->socialNetworks);
	}

	/**
	 * Builds the client options.
	 *
	 * @return string
	 */
	protected function buildClientOptions()
	{
		$this->clientOptions = array_merge([
			'socialNetworks' => array_filter([
				self::FACEBOOK => $this->socialNetworks[self::FACEBOOK]['url'],
				self::TWITTER => $this->socialNetworks[self::TWITTER]['url'],
				self::LINKEDIN => $this->socialNetworks[self::LINKEDIN]['url'],
				self::PINTEREST => $this->socialNetworks[self::PINTEREST]['url'],
			]),
		], $this->clientOptions);

		return Json::encode($this->clientOptions);
	}

	/**
	 * Registers the widget assets.
	 */
	protected function registerAssets()
	{
		$view = $this->getView();

		// Register assets
		SocialShareAsset::register($view);

		// Register widget hash JavaScript variable
		$view->registerJs("var {$this->getHashVar()} = {$this->buildClientOptions()};", View::POS_HEAD);

		// Build client script
		$js = "jQuery('{$this->getClientSelector()}').yiiSocialShare({$this->getHashVar()})";

		// Build client events
		if (!empty($this->clientEvents)) {
			foreach ($this->clientEvents as $clientEvent => $eventHandler) {
				if (!($eventHandler instanceof JsExpression)) {
					$eventHandler = new JsExpression($eventHandler);
				}
				$js .= ".on('{$clientEvent}', {$eventHandler})";
			}
		}

		// Register widget JavaScript
		$view->registerJs("{$js};");
	}
}
