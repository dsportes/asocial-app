<template>
  <div>
    <q-card class="petitelargeur maauto fs-md q-pa-sm">
      <div class="row justify-center">
      <!-- Déconnexion -->
      <div class="btn2" @click="ui.oD('dialoguedrc')">
        <q-btn v-if="session.ok" dense size="md" color="warning" icon="logout" />
        <span class="q-ml-sm">{{$t('MLAdrc2')}}</span>
      </div>

      <div class="btn2">
        <bouton-help page="page1" :label="$t('aide')"/>
      </div>

      <div class="btn2">
        <bouton-langue :label="$t('langue')"/>
      </div>

      <!-- Dark ou clair -->
      <div class="btn2" @click="tgdark">
        <q-btn dense size="md" icon="contrast"/>
        <span class="q-ml-xs">{{$t('clairfonce')}}</span>
      </div>

      <!-- Outils et tests -->
      <div class="btn2" @click="ui.oD('PAoutilsTests')">
        <q-btn dense size="md" icon="settings"/>
        <span class="q-ml-xs">{{$t('MLAout')}}</span>
      </div>

      <!-- Information session : mode synchro -->
      <div v-if="session.synchro" class="btn2" @click="infoSession">
        <q-btn class="q-mr-xs" dense size="md" icon="autorenew" color="primary">
          <queue-icon/>
        </q-btn>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Information session : mode incognito -->
      <div v-if="session.incognito" class="btn2" @click="infoSession">
        <q-avatar class="q-mr-xs" size="sm" square color="primary">
          <img src="~assets/incognito_blanc.svg">
        </q-avatar>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Information session : mode avion -->
      <div v-if="session.avion" class="btn2" @click="infoSession">
        <q-btn class="q-mr-xs" dense size="md" icon="airplanemode_active" color="primary">
          <queue-icon/>
        </q-btn>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Notifications -->
      <div class="btn2" @click="clickNotif">
        <notif-icon2 class="q-ml-xs" :alire="session.alire" :niv="session.niv"/>
        <span class="q-ml-xs">{{$t('MLAntf')}}</span>
      </div>

      <!-- Abonnement -->
      <div class="btn2" @click="clickAbo">
        <notif-icon2 class="q-ml-xs" :alire="session.alire" :niv="session.niv"/>
        <span class="q-ml-xs">{{$t('MLAabo')}}</span>
      </div>

      <!-- credits -->
      <div v-if="session.estComptable || aSt.compta.estA"
        class="btn2" @click="clickCred">
        <notif-icon2 class="q-ml-xs" :alire="session.alire" :niv="session.niv"/>
        <span class="q-ml-xs">{{$t('MLAcred')}}</span>
      </div>

      <!-- Chats d'urgence -->
      <div class="btn2" @click="clickChats">
        <notif-icon2 class="q-ml-xs" :alire="session.alire" :niv="session.niv"/>
        <span class="q-ml-xs">{{$t('MLAchats')}}</span>
      </div>

      <!-- Fichiers avion -->
      <div v-if="!session.incognito" class="btn2" @click="ficAvion">
        <q-btn dense size="md" icon="save"/>
        <span class="q-ml-xs">{{$t('MLAfav')}}</span>
      </div>

      <!-- Presse papier -->
      <div class="btn2" @click="ui.oD('pressepapier')">
        <q-btn dense size="md" icon="content_paste"/>
        <span class="q-ml-xs">{{$t('MLApp')}}</span>
      </div>

      </div>
    </q-card>

    <q-card class="q-mt-lg petitelargeur maauto q-pa-sm">
      <page-menu/>
    </q-card>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonLangue from '../components/BoutonLangue.vue'
import NotifIcon2 from '../components/NotifIcon2.vue'
import QueueIcon from '../components/QueueIcon.vue'
import PageMenu from '../pages/PageMenu.vue'

export default {
  name: 'PageAccueil',

  components: { PageMenu, BoutonHelp, BoutonLangue, NotifIcon2, QueueIcon },

  computed: {
    pccl () {return this.aSt.compta.pc < 80 ? 'bg-transparent' : (this.aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
  },

  methods: {
    tgdark () { this.$q.dark.toggle() },

    closeOutils () { this.outilsTests = false },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },

    clickChats () {
      this.ui.setPage('compta', 'chats')
    },

    clickAbo () {
      this.ui.setPage('compta', 'compta')
    },

    clickCred () { 
      this.ui.setPage('compta', 'credits')
    },

    infoSession () { 
      this.ui.setPage('session')
    },

    ficAvion () {
      this.ui.setPage('ficavion')
    }

  },

  data () {
    return {
    }
  },

  setup () {

    return {
      ui: stores.ui,
      session: stores.session,
      aSt: stores.avatar,
    }
  }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn1, .btn3
  width: 9rem
  height: 2rem
  line-height: 0.8rem
  overflow: hidden
  padding: 0.1rem
  margin: 0.2rem
.btn2
  width: 14rem
  height: 2rem
  overflow: hidden
  padding: 0.1rem
  margin: 0.2rem
  border-radius: 5px
  border:  1px solid grey
  cursor: pointer
.btn3
  width: 14rem
.bdg1
  position: absolute
  top: 6px
  width: 24px
</style>

