// var editor = wp.codeEditor.initialize($('#my_textarea'), my_var.cm_settings);
// var errors = codeEditor.find('.CodeMirror-lint-marker-error');
// console.log(errors.length);

const {
	element: { createElement: node, useRef, useEffect, memo },
	codeEditor: { initialize, defaultSettings }
} = window.wp;

export default memo( ( { onChange, mode, ...props } ) => {
	const ref = useRef();

	useEffect(() => {
		const editor = initialize( ref.current, {
			...defaultSettings,
			codemirror: {
				...defaultSettings.codemirror,
				tabSize: 4,
				mode,
				lineNumbers: false
			}
		});

		editor.codemirror.on('change', () => {
			onChange( editor.codemirror.getValue() );
		});

		return () => {
			editor.codemirror.toTextArea();
		};
	});

	return node( 'textarea', {
		ref,
		...props
	});
  // Never rerender.
}, () => true);
