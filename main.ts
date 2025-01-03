import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

enum VimMode {
	None,
	Normal,
	Insert,
	Visual,
	Replace,
}

interface WitchKeyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: WitchKeyPluginSettings = {
	mySetting: "default",
};

export default class WitchKeyPlugin extends Plugin {
	settings: WitchKeyPluginSettings;

	private codeMirrorVim: CodeMirror.Editor;
	private vimMode: VimMode = VimMode.None;

	private getActiveView(): MarkdownView | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	private getCodeMirrorEditor(view: MarkdownView): CodeMirror.Editor {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const codeMirrorEditor = (view as any).editMode?.editor?.cm?.cm;
		return codeMirrorEditor;
	}

	private syncVimModeOnChange = (ev: {
		mode: "insert" | "normal" | "visual" | "replace";
	}): void => {
		console.log("syncVimModeOnChange(), event:", ev);

		if (!ev) {
			return;
		}

		switch (ev.mode) {
			case "insert":
				this.vimMode = VimMode.Insert;
				break;
			case "normal":
				this.vimMode = VimMode.Normal;
				break;
			case "visual":
				this.vimMode = VimMode.Visual;
				break;
			case "replace":
				this.vimMode = VimMode.Replace;
				break;
			default:
				this.vimMode = VimMode.None;
				break;
		}

		new Notice(ev.mode);
	};

	private setupVimHandlers() {
		const view = this.getActiveView();
		if (view) {
			this.vimMode = VimMode.None;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cmEditor = this.getCodeMirrorEditor(view) as any;
			cmEditor.off("vim-mode-change", this.syncVimModeOnChange);
			cmEditor.on("vim-mode-change", this.syncVimModeOnChange);
		}
	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WitchKeySettingTab(this.app, this));

		const view = this.getActiveView();

		if (!view) {
			// This means that no Markdown view is available on plugin load.
			// We add handlers to wait until a window is open.

			this.app.workspace.on("window-open", () => {
				console.log("window-open");
				this.setupVimHandlers();
			});
			this.app.workspace.on("window-close", () => {
				console.log("window-close");
				this.setupVimHandlers();
			});
			this.app.workspace.on("active-leaf-change", () => {
				console.log("active-leaf-change");
				this.setupVimHandlers();
			});
			this.app.workspace.on("file-open", () => {
				console.log("file-open");
				this.setupVimHandlers();
			});
		}

		this.setupVimHandlers();
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class WitchKeySettingTab extends PluginSettingTab {
	plugin: WitchKeyPlugin;

	constructor(app: App, plugin: WitchKeyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
