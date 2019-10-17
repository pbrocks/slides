(({
  i18n,
  blocks,
  editor,
  element,
  richText,
  plugins,
  editPost,
  data,
  components,
  blockEditor
}) => {
  const { __ } = i18n;
  const { registerBlockType, createBlock } = blocks;
  const { RichTextToolbarButton } = editor;
  const { createElement: e, Fragment } = element;
  const { registerFormatType, toggleFormat } = richText;
  const { registerPlugin } = plugins;
  const { PluginDocumentSettingPanel } = editPost;
  const { useSelect, useDispatch, subscribe, select, dispatch } = data;
  const { TextareaControl, ColorPicker, PanelBody, RangeControl, TextControl, SelectControl, ToggleControl, Button, FocalPointPicker } = components;
  const { MediaUpload, __experimentalGradientPickerControl, InnerBlocks, InspectorControls } = blockEditor;
  const colorKey = 'presentation-color';
  const bgColorKey = 'presentation-background-color';
  const backgroundGradientKey = 'presentation-background-gradient';
  const backgroundUrlKey = 'presentation-background-url';
  const backgroundIdKey = 'presentation-background-id';
  const backgroundPositionKey = 'presentation-background-position';
  const backgroundOpacityKey = 'presentation-background-opacity';
  const cssKey = 'presentation-css';
  const fontSizeKey = 'presentation-font-size';
  const fontFamilyKey = 'presentation-font-family';
  const transitionKey = 'presentation-transition';
  const transitionSpeedKey = 'presentation-transition-speed';
  const controlsKey = 'presentation-controls';
  const progressKey = 'presentation-progress';
  const cssPrefix = '.block-editor-block-list__layout .block-editor-block-list__block[data-type="slide/slide"]';

  subscribe(() => {
    const blocks = select('core/block-editor').getBlocks();
    const block = blocks.find(({ name }) => name !== 'slide/slide');

    if (!block) {
      return;
    }

    const slide = createBlock('slide/slide', {}, [
      createBlock(block.name, block.attributes)
    ]);

    dispatch('core/block-editor').replaceBlock(block.clientId, slide);
  });

  registerPlugin('slide', {
    render: () => {
      const meta = useSelect((select) =>
        select('core/editor').getEditedPostAttribute('meta')
      );
      const { editPost } = useDispatch('core/editor');
      const updateMeta = (value, key) => editPost({
        meta: { ...meta, [key]: value }
      });
      const rules = {
        color: meta[colorKey] || '#000',
        'background-color': meta[bgColorKey] || '#fff',
        'background-image': meta[backgroundGradientKey] || 'none',
        'font-size': (meta[fontSizeKey] || '42') + 'px',
        'font-family': meta[fontFamilyKey] || 'Helvetica, sans-serif'
      };

      const backgroundRules = {
        'background-image': meta[backgroundUrlKey] ? `url("${meta[backgroundUrlKey]}")` : 'none',
        'background-size': 'cover',
        'background-position': meta[backgroundPositionKey] ? meta[backgroundPositionKey] : '50% 50%',
        opacity: meta[backgroundOpacityKey] ? meta[backgroundOpacityKey] / 100 : 1
      };

      return [
        ...Object.keys(rules).map((key) => {
          return e(
            'style',
            null,
            `${cssPrefix} section {${key}:${rules[key]}}`
          );
        }),
        ...Object.keys(backgroundRules).map((key) => {
          return e(
            'style',
            null,
            `${cssPrefix} section .wp-block-slide-slide__background {${key}:${backgroundRules[key]}}`
          );
        }),
        e('style', null, meta[cssKey]),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-font',
            title: __('Font', 'slide'),
            icon: 'text'
          },
          e(RangeControl, {
            label: __('Font Size', 'slide'),
            value: parseInt(meta[fontSizeKey], 10),
            min: 10,
            max: 100,
            onChange: (value) => updateMeta(value + '', fontSizeKey)
          }),
          e(TextControl, {
            label: __('Font Family', 'slide'),
            help: __('E.g. "Helvetica, sans-serif" or "Georgia, serif"', 'slide'),
            value: meta[fontFamilyKey],
            onChange: (value) => updateMeta(value, fontFamilyKey)
          }),
          e(ColorPicker, {
            disableAlpha: true,
            label: __('Color', 'slide'),
            color: meta[colorKey],
            onChangeComplete: (value) => updateMeta(value.hex, colorKey)
          })
        ),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-background',
            title: __('Background', 'slide'),
            icon: 'art'
          },
          e(ColorPicker, {
            disableAlpha: true,
            label: __('Background Color', 'slide'),
            color: meta[bgColorKey],
            onChangeComplete: (value) => {
              editPost({
                meta: {
                  ...meta,
                  [bgColorKey]: value.hex,
                  [backgroundGradientKey]: ''
                }
              });
            }
          }),
          __('Experimental:'),
          e(__experimentalGradientPickerControl, {
            onChange: (value) => updateMeta(value, backgroundGradientKey),
            value: meta[backgroundGradientKey]
          })
        ),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-background-image',
            title: __('Background Image', 'slide'),
            icon: 'format-image'
          },
          e(MediaUpload, {
            onSelect: (media) => {
              if (!media || !media.url) {
                editPost({
                  meta: {
                    ...meta,
                    [backgroundUrlKey]: undefined,
                    [backgroundIdKey]: undefined,
                    [backgroundPositionKey]: undefined,
                    [backgroundOpacityKey]: undefined
                  }
                });
                return;
              }

              editPost({
                meta: {
                  ...meta,
                  [backgroundUrlKey]: media.url,
                  [backgroundIdKey]: media.id + ''
                }
              });
            },
            allowedTypes: ALLOWED_MEDIA_TYPES,
            value: parseInt(meta[backgroundIdKey], 10),
            render: ({ open }) => e(Button, {
              isDefault: true,
              onClick: open
            }, meta[backgroundUrlKey] ? __('Change') : __('Add Background Image'))
          }),
          ' ',
          !!meta[backgroundUrlKey] && e(Button, {
            isDefault: true,
            onClick: () => {
              editPost({
                meta: {
                  ...meta,
                  [backgroundUrlKey]: undefined,
                  [backgroundIdKey]: undefined,
                  [backgroundPositionKey]: undefined,
                  [backgroundOpacityKey]: undefined
                }
              });
            }
          }, __('Remove')),
          e('br'), e('br'),
          !!meta[backgroundUrlKey] && e(FocalPointPicker, {
            label: __('Focal Point Picker'),
            url: meta[backgroundUrlKey],
            value: (() => {
              if (!meta[backgroundPositionKey]) {
                return;
              }

              let [x, y] = meta[backgroundPositionKey].split(' ');

              x = parseFloat(x) / 100;
              y = parseFloat(y) / 100;

              return { x, y };
            })(),
            onChange: (focalPoint) => {
              editPost({
                meta: {
                  ...meta,
                  [backgroundPositionKey]: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`
                }
              });
            }
          }),
          !!meta[backgroundUrlKey] && e(RangeControl, {
            label: __('Opacity', 'slide'),
            value: parseInt(meta[backgroundOpacityKey], 10),
            min: 0,
            max: 100,
            onChange: (value) => {
              editPost({
                meta: {
                  ...meta,
                  [backgroundOpacityKey]: value + ''
                }
              });
            }
          })
        ),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-css',
            title: __('Custom CSS', 'slide'),
            icon: 'editor-code'
          },
          e(TextareaControl, {
            label: __('Custom CSS Rules', 'slide'),
            help: __('Please prefix all rules with "section.wp-block-slide-slide"!', 'slide'),
            value: meta[cssKey] || 'section.wp-block-slide-slide {}',
            onChange: (value) => updateMeta(value, cssKey)
          })
        ),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-transition',
            title: __('Transition', 'slide'),
            icon: 'slides'
          },
          e(SelectControl, {
            label: __('Transition Style', 'slide'),
            options: [
              { value: 'none', label: __('None', 'slide') },
              { value: 'fade', label: __('Fade', 'slide') },
              { value: 'slide', label: __('Slide', 'slide') },
              { value: 'convex', label: __('Convex', 'slide') },
              { value: 'concave', label: __('Concave', 'slide') },
              { value: 'zoom', label: __('Zoom', 'slide') }
            ],
            value: meta[transitionKey],
            onChange: (value) => updateMeta(value, transitionKey)
          }),
          e(SelectControl, {
            label: __('Transition Speed', 'slide'),
            options: [
              { value: 'default', label: __('Default', 'slide') },
              { value: 'fast', label: __('Fast', 'slide') },
              { value: 'slow', label: __('Slow', 'slide') }
            ],
            value: meta[transitionSpeedKey],
            onChange: (value) => updateMeta(value, transitionSpeedKey)
          })
        ),
        e(
          PluginDocumentSettingPanel,
          {
            name: 'slide-controls',
            title: __('Controls', 'slide'),
            icon: 'leftright'
          },
          e(ToggleControl, {
            label: __('Control Arrows', 'slide'),
            checked: meta[controlsKey] === 'true',
            onChange: (value) => updateMeta(value + '', controlsKey)
          }),
          e(ToggleControl, {
            label: __('Progress Bar', 'slide'),
            checked: meta[progressKey] === 'true',
            onChange: (value) => updateMeta(value + '', progressKey)
          })
        )
      ];
    }
  });

  const ALLOWED_MEDIA_TYPES = ['image'];

  registerBlockType('slide/slide', {
    title: __('Slide', 'slide'),
    icon: 'slides',
    category: 'common',
    keywords: [__('Presentation', 'slide')],
    attributes: {
      notes: {
        type: 'string'
      },
      color: {
        type: 'string'
      },
      backgroundColor: {
        type: 'string'
      },
      backgroundId: {
        type: 'string'
      },
      backgroundUrl: {
        type: 'string'
      },
      focalPoint: {
        type: 'object'
      },
      backgroundOpacity: {
        type: 'string'
      }
    },
    edit: ({ attributes, setAttributes, className }) => {
      const meta = useSelect((select) =>
        select('core/editor').getEditedPostAttribute('meta')
      );

      return e(
        Fragment,
        null,
        e(
          InspectorControls,
          null,
          e(
            PanelBody,
            {
              title: __('Slide Notes', 'slide'),
              icon: 'edit',
              initialOpen: false
            },
            e(TextareaControl, {
              label: __('Anything you want to remember.', 'slide'),
              value: attributes.notes,
              onChange: (notes) => setAttributes({ notes })
            })
          ),
          e(
            PanelBody,
            {
              title: __('Font', 'slide'),
              icon: 'text',
              initialOpen: false
            },
            e(ColorPicker, {
              disableAlpha: true,
              label: __('Color', 'slide'),
              color: attributes.color,
              onChangeComplete: ({ hex: color }) =>
                setAttributes({ color })
            }),
            !!attributes.color && e(Button, {
              isDefault: true,
              onClick: () => {
                setAttributes({
                  color: undefined
                });
              }
            }, __('Remove'))
          ),
          e(
            PanelBody,
            {
              title: __('Background Color', 'slide'),
              icon: 'art',
              initialOpen: false
            },
            e(ColorPicker, {
              disableAlpha: true,
              label: __('Background Color', 'slide'),
              color: attributes.backgroundColor,
              onChangeComplete: ({ hex: backgroundColor }) =>
                setAttributes({ backgroundColor })
            }),
            (attributes.backgroundUrl || meta[backgroundUrlKey]) &&
            e(RangeControl, {
              label: __('Opacity', 'slide'),
              value: 100 - parseInt(attributes.backgroundOpacity, 10),
              min: 0,
              max: 100,
              onChange: (value) => setAttributes({
                backgroundOpacity: 100 - value + ''
              })
            }),
            !!attributes.backgroundColor && e(Button, {
              isDefault: true,
              onClick: () => {
                setAttributes({
                  backgroundColor: undefined
                });
              }
            }, __('Remove'))
          ),
          e(
            PanelBody,
            {
              title: __('Background Image', 'slide'),
              icon: 'format-image',
              initialOpen: false
            },
            e(MediaUpload, {
              onSelect: (media) => {
                if (!media || !media.url) {
                  setAttributes({
                    backgroundUrl: undefined,
                    backgroundId: undefined,
                    focalPoint: undefined
                  });
                  return;
                }

                setAttributes({
                  backgroundUrl: media.url,
                  backgroundId: media.id
                });
              },
              allowedTypes: ALLOWED_MEDIA_TYPES,
              value: attributes.backgroundId,
              render: ({ open }) => e(Button, {
                isDefault: true,
                onClick: open
              }, attributes.backgroundUrl ? __('Change') : __('Add Background Image'))
            }),
            ' ',
            !!attributes.backgroundUrl && e(Button, {
              isDefault: true,
              onClick: () => {
                setAttributes({
                  backgroundUrl: undefined,
                  backgroundId: undefined,
                  focalPoint: undefined
                });
              }
            }, __('Remove')),
            e('br'), e('br'),
            !!attributes.backgroundUrl && e(FocalPointPicker, {
              label: __('Focal Point Picker'),
              url: attributes.backgroundUrl,
              value: attributes.focalPoint,
              onChange: (focalPoint) => setAttributes({ focalPoint })
            }),
            !!attributes.backgroundUrl && e(RangeControl, {
              label: __('Opacity', 'slide'),
              value: parseInt(attributes.backgroundOpacity, 10),
              min: 0,
              max: 100,
              onChange: (value) => setAttributes({
                backgroundOpacity: value + ''
              })
            })
          )
        ),
        e(
          'section',
          {
            className,
            style: {
              color: attributes.color || undefined,
              backgroundColor: attributes.backgroundColor || undefined,
              // If a background color is set, disable the global gradient.
              backgroundImage: attributes.backgroundColor ? 'none' : undefined
            }
          },
          e(
            'div',
            {
              className: 'wp-block-slide-slide__background',
              style: {
                backgroundImage: attributes.backgroundUrl ? `url("${attributes.backgroundUrl}")` : undefined,
                backgroundPosition: attributes.focalPoint ? `${attributes.focalPoint.x * 100}% ${attributes.focalPoint.y * 100}%` : undefined,
                opacity: attributes.backgroundOpacity ? attributes.backgroundOpacity / 100 : undefined
              }
            }
          ),
          e(InnerBlocks)
        )
      );
    },
    save: ({ attributes }) => e(
      'section',
      {
        style: {
          color: attributes.color || undefined
        },
        'data-background-color': attributes.backgroundColor || undefined,
        'data-background-image': attributes.backgroundUrl ? attributes.backgroundUrl : undefined,
        'data-background-position': attributes.focalPoint ? `${attributes.focalPoint.x * 100}% ${attributes.focalPoint.y * 100}%` : undefined,
        'data-background-opacity': attributes.backgroundOpacity ? attributes.backgroundOpacity / 100 : undefined
      },
      e(InnerBlocks.Content)
    )
  });

  registerFormatType('slide/fragment', {
    title: __('Slide Fragment', 'slide'),
    tagName: 'span',
    className: 'fragment',
    edit: ({ value, onChange }) =>
      e(RichTextToolbarButton, {
        icon: 'editor-textcolor',
        title: __('Slide Fragment', 'slide'),
        onClick: () => {
          onChange(toggleFormat(value, { type: 'slide/fragment' }));
        }
      })
  });

  window.addEventListener('DOMContentLoaded', resize);

  function resize () {
    const element = document.querySelector('.block-editor-writing-flow');

    if (!element) {
      window.requestAnimationFrame(resize);
      return;
    }

    const width = element.clientWidth;
    const margin = width / 33;
    const parentWidth = element.parentNode.clientWidth - margin * 2;
    const scale = Math.min(1, parentWidth / width);
    const marginLeft = scale === 1 ? ((parentWidth - width) / 2) + margin : margin;
    const transform = `translate(${marginLeft}px, ${margin}px) scale(${scale})`;

    if (element.style.transform !== transform) {
      element.style.transformOrigin = '0 0';
      element.style.transform = transform;
    }

    window.requestAnimationFrame(resize);
  }
})(window.wp);
