<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar>
      <q-btn dense icon="play_arrow" class="play" 
        :color="(session.ok && session.niveau > 1) ? 'green-5' : 'greey-5'"
        :disable="session.niveau <= 1" @click="ui.goto11"/>

      <q-toolbar-title style="max-height:1.3rem;" class="row no-wrap items-center">
        <!--img class="logo" :src="config.logo"/-->
        <titre-banner v-if="session.ok && session.compte.estComptable"
          class-titre="titre-md" :titre="$t('MLAestc')"  :id-objet="session.compte.id"/>
        <span v-if="session.ok && !session.compte.estComptable" class="row no-wrap">
          <titre-banner class-titre="titre-md"
            :titre="session.compte.estParrain ? $t('MLAcptp') : $t('MLAcptn')" 
            :id-objet="session.compte.id"/>
          <span class="titre-md q-ml-sm">{{$t('MLAtri', [session.compte.nat.nom])}}</span>
        </span>
      </q-toolbar-title>

      <q-icon v-if="session.ok && !session.compte.estComptable && ardf" size="sm"
        class="q-mx-xs cursor-pointer" name="chat" :color="ardf === 1 ? 'yellow-7' : 'green-5'">
        <q-menu transition-show="flip-up" transition-hide="flip-down">
          <q-banner inline-actions dense rounded>
            <span class="titre-sm q-mr-sm">{{$t('MLAard' + ardf)}}</span>
            <q-btn class="q-ml-md" color="warning" dense size="sm" icon="close" v-close-popup />
            <div>
              <q-btn dense color="primary" size="sm" :label="$t('MLAardb')" icon="chat" v-close-popup 
                @click="ouvrirArdoise()"/>
            </div>
          </q-banner>
        </q-menu>
      </q-icon>

      <q-btn v-if="session.blocage" class="q-mr-xs" dense
        :icon="['','notification_important', 'fullscreen_exit', 'edit_off', 'lock_outline'][session.blocage]"
        :color="['','warning','warning','negative','negative'][session.blocage]" 
        @click="infoBlocage()"/>

      <q-btn class="q-ml-xs" v-if="session.synchro" @click="ui.infoSession = true"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <q-avatar class="cursor-pointer q-ml-xs" v-if="session.incognito"  @click="ui.infoSession = true"
        size="md" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <q-btn class="cursor-pointer q-ml-xs" v-if="session.avion" @click="ui.infoSession = true"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <q-btn class="q-ml-xs" flat dense size="md" icon="settings" @click="ui.menu = !ui.menu">
        <q-tooltip>{{$t('PMEtit')}}</q-tooltip>
      </q-btn>

      <q-btn v-if="session.ok" dense size="md" color="warning" icon="logout" @click="drc=true">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
      </q-btn>

      <bouton-help page="page1"/>
    </q-toolbar>

    <q-toolbar v-if="session.niveau === 1" inset>
      <q-tabs v-model="ui.tabCompte" inline-label no-caps dense>
        <q-tab name="detailCompte" :label="$t('MLAt1c')" @click="ui.goto10"/>
        <q-tab name="listeAvatars" :label="$t('MLAt1a')" @click="ui.goto11"/>
        <q-tab v-if="session.estComptable" name="listeTribus" :label="$t('MLAt1t')" @click="ui.goto12"/>
      </q-tabs>
    </q-toolbar>

    <q-toolbar style="max-height:1.3rem;" v-if="session.niveau > 1" inset :class="tbclass">
      <q-btn dense icon="play_arrow" class="play" :color="session.niveau === 2 ? 'grey-5' : 'green-5'"
        :disable="session.niveau === 2" @click="ui.goto20"/>
      <q-toolbar-title class="q-pl-md titre-md row items-center no-wrap">
        <span class="titre-md q-px-sm">{{$t('avatar')}}</span>
        <titre-banner class-titre="titre-md" :titre="nomcAv" :id-objet="session.avC.id"/>
        <span class="titre-md q-ml-sm">{{titreAv}}</span>
      </q-toolbar-title>
    </q-toolbar>

    <q-toolbar v-if="session.niveau === 2" inset>
      <q-tabs v-model="ui.tabAvatar" inline-label no-caps dense>
        <q-tab name="detailAvatar" class="text-italic" :label="$t('MLAt2a')" @click="ui.goto20()"/>
        <q-tab name="listeSecrets" :label="$t('MLAt2s')" @click="ui.goto21()"/>
        <q-tab name="listeContacts" :label="$t('MLAt2c')" @click="ui.goto22()"/>
        <q-tab name="listeGroupes" :label="$t('MLAt2g')" @click="ui.goto23()"/>
      </q-tabs>
    </q-toolbar>

  </q-header>

  <q-drawer v-model="ui.menu" show-if-above side="right" bordered>
    <panel-menu/>
  </q-drawer>

  <q-footer v-if="session.ok" class="row justify-around" elevated>
    <div class="column items-center">
      <q-btn class="btnf" dense color="primary" size="md" icon="people"
        @click="panelcontactsAut"/>
      <span class="titre-sm">{{$t('MLActc')}}</span>
    </div>
    <div class="column items-center">
     <q-btn class="btnf" dense color="primary" size="md" icon="save"
        @click="fichiersavionAut"/>
      <span class="titre-sm">{{$t('MLAfic')}}</span>
     </div>
    <div class="column items-center">
      <q-btn class="btnf" dense color="primary" size="md" icon="chat"
        @click="ouvrirArdoise()"/>
      <span class="titre-sm">{{$t('MLAardb')}}</span>
    </div>
    <div class="column items-center">
      <q-btn class="btnf" dense color="primary" size="md" icon="content_paste"
        @click="ouvrirftlocal"/>
     <span class="titre-sm">{{$t('MLAclpb')}}</span>
    </div>
  </q-footer>

  <q-page-container>
    <login v-if="session.status===0"/>
    <synchro v-if="session.status===1"/>
    <page10 v-if="session.status===10"/> <!--détail du compte -->
    <page11 v-if="session.status===11"/> <!--Liste des avatats du compte -->
    <page12 v-if="session.status===12"/> <!--Liste des Tribus -->
    <page20 v-if="session.status===20"/> <!--détail de l'avatar courant -->
    <page21 v-if="session.status===21"/> <!--Liste des secrets de l'avatar courant -->
    <page22 v-if="session.status===22"/> <!--Liste des contacts de l'avatar courant-->
    <page23 v-if="session.status===23"/> <!--Liste des groupes de l'avatar courant-->
  </q-page-container>

  <q-dialog v-model="ui.aunmessage" seamless position="bottom">
    <div :class="'q-pa-sm cursor-pointer ' + (ui.message.important ? 'msgimp' : 'text-white bg-grey-9')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <q-dialog v-model="drc">
    <q-card  class="q-ma-xs petitelargeur">
      <q-card-section>
        <div class="titre-lg">{{$t('MLAdrc')}}</div>
      </q-card-section>
      <q-card-actions vertical align="center">
        <q-btn dense size="md" color="warning"
          icon="logout" :label="$t('MLAdecon')" @click="deconnexion" v-close-popup/>
        <q-btn class="q-ma-xs" dense size="md" color="warning"
          icon="logout" :label="$t('MLArecon')" @click="reconnexion" v-close-popup/>
        <q-btn class="q-ma-xs" dense size="md" color="primary"
          :label="$t('MLAcont')" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-if="ui.dialogueerreur" v-model="ui.dialogueerreur" persistent>
    <dialogue-erreur/>
  </q-dialog>

  <q-dialog v-if="ui.dialoguehelp" v-model="ui.dialoguehelp" full-height position="left">
    <dialogue-help/>
  </q-dialog>

  <q-dialog v-if="ui.infoBlocage" v-model="ui.infoBlocage" full-height persistent>
    <info-blocage/>
  </q-dialog>

  <q-dialog v-model="ui.infoSession" full-height persistent>
    <info-session/>
  </q-dialog>

  <q-dialog v-if="ui.gestionBases" v-model="ui.gestionBases" full-height persistent>
    <gestion-bases/>
  </q-dialog>

  <q-dialog v-if="ui.testPing" v-model="ui.testPing" full-height persistent>
    <test-ping/>
  </q-dialog>

  <q-dialog v-if="ui.outilsCrypto" v-model="ui.outilsCrypto" full-height persistent>
    <outils-crypto/>
  </q-dialog>

  <q-dialog v-if="ui.rapportSynchro" v-model="ui.rapportSynchro" full-height persistent>
    <rapport-synchro/>
  </q-dialog>

  <q-dialog v-if="ui.rapportSynchroMenu" v-model="ui.rapportSynchroMenu" full-height persistent>
    <rapport-synchro close/>
  </q-dialog>

  <q-dialog v-if="ui.panelContacts" v-model="ui.panelContacts" full-height position="left">
    <panel-contacts/>
  </q-dialog>

  <q-dialog v-if="ui.panelCompta" v-model="ui.panelCompta" full-height position="right">
    <panel-compta/>
  </q-dialog>

  <q-dialog v-if="ui.ardoiseTribu" v-model="ui.ardoiseTribu" full-height persistent>
    <ardoise-tribu/>
  </q-dialog>

  <!--
  <fichiers-avion/>
  -->

</q-layout>
</template>

<script>
import { useQuasar } from 'quasar'
import { ref } from 'vue'

import stores from './stores/stores.mjs'

import { $t } from './app/util.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import TitreBanner from './components/TitreBanner.vue'

import Login from './pages/Login.vue'
import Synchro from './pages/Synchro.vue'
import Page10 from './pages/Page10.vue'
import Page11 from './pages/Page11.vue'
import Page12 from './pages/Page12.vue'
import Page20 from './pages/Page20.vue'
import Page21 from './pages/Page21.vue'
import Page22 from './pages/Page22.vue'
import Page23 from './pages/Page23.vue'

import DialogueErreur from './dialogues/DialogueErreur.vue'
import DialogueHelp from './dialogues/DialogueHelp.vue'
import InfoBlocage from './dialogues/InfoBlocage.vue'
import InfoSession from './dialogues/InfoSession.vue'
import TestPing from './dialogues/TestPing.vue'
import PanelContacts from './dialogues/PanelContacts.vue'
import GestionBases from './dialogues/GestionBases.vue'
import RapportSynchro from './components/RapportSynchro.vue'
import OutilsCrypto from './dialogues/OutilsCrypto.vue'
import PanelMenu from './dialogues/PanelMenu.vue'
import ArdoiseTribu from './dialogues/ArdoiseTribu.vue'
import PanelCompta from './dialogues/PanelCompta.vue'

export default {
  name: 'App',

  components: { BoutonHelp, TitreBanner,
    Login, Synchro, DialogueErreur, DialogueHelp, InfoBlocage, InfoSession, RapportSynchro, OutilsCrypto,
    TestPing, GestionBases, PanelContacts, PanelMenu, ArdoiseTribu, PanelCompta,
    Page10, Page11, Page12, Page20, Page21, Page22, Page23 },

  computed: {
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    titreAv () { return this.session.avC.na.titre },
    nomcAv () { 
      const x = this.session.avC
      return x.nomc
    },
    ardf () {
      return !this.session.ok ? 0 : (!this.maCompta.sta ? 1 : (this.maCcompta.staa[1] === 0 ? 1 : 2))
    },
    maCompta () { return avStore.compta },
    naMaTribu () { return this.session.compte.nat }
  },

  watch : {
  },

  data () { return {
  }},

  methods: {
    deconnexion () { deconnexion() },
    async reconnexion () { await reconnexionCompte() },

    async infoBlocage () { await this.ui.ouvrirInfoBlocage(true) },
    async panelcontactsAut () { if (await this.session.aut(4)) this.ui.panelContacts = true },
    async fichiersavionAut () { if (await this.session.aut(4)) this.ui.fichiersAvion = true },
    ouvrirftlocal () { this.dialogueftlocal = true },
    ouvrirTribu () { },
    ouvrirArdoise () {
      this.ui.ouvrirArdoiseTribu(this.maCompta, this.naMaTribu)
    }
  },

  setup () {
    const $q = useQuasar()
    $q.dark.set(true)

    const config = stores.config
    config.$q = $q
    const session = stores.session
    const ui = stores.ui
    const avStore = stores.avatar

    console.log($t('build', [config.build, config.debug]))
 
    if (config.reseaux.length === 1) {
      session.reseau = config.reseaux[0]
    } else {
      if (config.reseauDef) session.reseau = config.reseauDef
    }

    const infomode = ref(false)
    const infonet = ref(false)
    const infoidb = ref(false)
    const drc = ref(false)
    const menuouvert = ref(false)

    return {
      session,
      config,
      ui,
      avStore,
      infonet,
      infoidb,
      infomode,
      drc,
      menuouvert
    }
  }
}
</script>

<style lang="sass" scoped>
@import './css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
.q-tabs--dense .q-tab
  min-height: 20px !important
.logo
  width: 1.2rem
.msgimp
  background-color: $grey-2
  color: $negative
  font-weight: bold
  border: 2px solid $negative
.play:hover
  color: $warning !important
</style>
