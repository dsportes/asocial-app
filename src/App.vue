<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar>
      <bouton-help page="page1"/>
      <bouton-langue/>
      <q-btn dense size="md" icon="contrast" @click="tgdark">
        <q-tooltip>{{$t('clairfonce')}}</q-tooltip>
      </q-btn>
      <q-btn flat dense size="md" icon="settings" @click="ui.outilsTests = true">
        <q-tooltip>{{$t('PMEtit')}}</q-tooltip>
      </q-btn>

      <q-btn class="q-mr-xs" v-if="session.synchro" @click="ui.infoSession = true"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito"  @click="ui.infoSession = true"
        size="sm" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="ui.infoSession = true"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <q-btn v-if="session.ok" dense size="md" color="warning" icon="logout" @click="drc = true">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
      </q-btn>

      <q-btn v-if="session.blocage" dense
        :icon="['','notification_important', 'fullscreen_exit', 'edit_off', 'lock_outline'][session.blocage]"
        :color="['','warning','warning','negative','negative'][session.blocage]" 
        @click="infoBlocage()"/>

      <q-toolbar-title class="titre-lg text-right cursor-pointer q-mx-md">
        <span v-if="session.ok">
          <span>{{session.compte.na.nomc}}</span>
          <!--
          <span class="titre-md q-mr-xs">{{$t('MLAtri', [session.compte.nct.nom])}}</span>
          -->
          <span v-if="session.compte.estParrain" class="titre-md q-mr-xs">{{$t('MLAcptp')}}</span>
        </span>
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
      </q-toolbar-title>
    </q-toolbar>

    <q-toolbar inset>
      <q-toolbar-title class="titre-lg text-right cursor-pointer q-mx-md">
        <span v-if="session.groupeId">{{session.groupe.na.nomc}}</span>
        <span v-else class="titre-md text-italic">{{$t('MLAngr')}}</span>
      </q-toolbar-title>
    </q-toolbar>

    <q-toolbar inset class="bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-toolbar-title class="titre-lg text-center cursor-pointer q-mx-md">
        {{$t('P' + ui.page)}}
      </q-toolbar-title>
    </q-toolbar>
<!--
    <q-toolbar style="max-height:1.3rem;" v-if="session.niveau > 1" inset :class="tbclass">
      <q-btn dense icon="play_arrow" class="play" :color="session.niveau === 2 ? 'grey-5' : 'green-5'"
        :disable="session.niveau === 2" @click="ui.goto20"/>
      <q-toolbar-title class="q-pl-md titre-md row items-center no-wrap">
        <span class="titre-md q-px-sm">{{$t('avatar')}}</span>
        <titre-banner class-titre="titre-md" :titre="nomcAv" :id-objet="session.avC.id"/>
        <span class="titre-md q-ml-sm">{{titreAv}}</span>
      </q-toolbar-title>
    </q-toolbar>
-->
  </q-header>

  <q-drawer v-model="ui.menu" show-if-above side="right" bordered>
  </q-drawer>

  <q-page-container>
    <transition appear
      leave-active-class="animated animate__fadeOut"
      enter-active-class="animated animate__slideInRight">
      <page-login class="page" v-if="ui.page === 'login'"/>
    </transition>
    <transition appear
      leave-active-class="animated animate__fadeOut"
      enter-active-class="animated animate__slideInRight">
      <page-session class="page" v-if="ui.page === 'session'"/>
    </transition>
    <transition appear
      leave-active-class="animated animate__fadeOut"
      enter-active-class="animated animate__slideInRight">
      <page-accueil class="page" v-if="ui.page === 'accueil'"/>
    </transition>
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

  <q-dialog v-if="ui.outilsTests" v-model="ui.outilsTests" full-height persistent>
    <outils-tests/>
  </q-dialog>

  <q-dialog v-if="ui.infoBlocage" v-model="ui.infoBlocage" full-height persistent>
    <info-blocage/>
  </q-dialog>

  <q-dialog v-if="ui.panelContacts" v-model="ui.panelContacts" full-height position="left">
    <panel-contacts/>
  </q-dialog>

  <q-dialog v-if="ui.panelCompta" v-model="ui.panelCompta" full-height position="right">
    <panel-compta/>
  </q-dialog>

</q-layout>
</template>

<script>
import { useQuasar } from 'quasar'
import { ref } from 'vue'

import stores from './stores/stores.mjs'

import { $t } from './app/util.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'

import PageLogin from './pages/PageLogin.vue'
import PageSession from './pages/PageSession.vue'
import PageAccueil from './pages/PageAccueil.vue'

import OutilsTests from './dialogues/OutilsTests.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import DialogueHelp from './dialogues/DialogueHelp.vue'
import InfoBlocage from './dialogues/InfoBlocage.vue'
import BoutonLangue from './components/BoutonLangue.vue'

import PanelContacts from './dialogues/PanelContacts.vue'
import PanelCompta from './dialogues/PanelCompta.vue'

export default {
  name: 'App',

  components: { 
    BoutonHelp, BoutonLangue, OutilsTests,
    PageLogin, PageSession, PageAccueil,
    DialogueErreur, DialogueHelp, InfoBlocage, 
    PanelContacts, PanelCompta
   },

  computed: {
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    maCompta () { return this.session.compta },
    naMaTribu () { return this.session.compte.nct }
  },

  watch : {
  },

  data () { return {
  }},

  methods: {
    tgdark () { this.$q.dark.toggle() },
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

<style lang="css">
@import 'animate.css'
</style>

<style lang="css">
/*
.page {
  animation-duration: 8s;
}
*/
</style>

<style lang="sass" scoped>
@import './css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
.msgimp
  background-color: $grey-2
  color: $negative
  font-weight: bold
  border: 2px solid $negative
</style>
