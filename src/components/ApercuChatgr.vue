<template>
  <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHGtit', [nag.nom])}}</q-toolbar-title>
        <q-btn :label="$t('CHGadd')" class="btn" icon="add" color="primary" @click="editer"/>
        <bouton-help page="page1"/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-card class="q-pa-sm">
        <div v-for="it in gSt.chatgr.items" :key="it.dh + '/' + it.im">
          <q-chat-message :sent="imNa(it.im)" 
            :bg-color="imNa(it.im) ? 'primary' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-dark1 v-if="!it.dhx" :texte="it.txt"/>
            <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{imNa(it.im) ? imNa(it.im).nom : membre(it.im).na.nomc }}</span>
                <q-btn v-if="(imNa(it.im) || egr.estAnim) && !it.dfx" size="sm" 
                  icon="clear" color="warning" @click="effacer(it.im, it.dh)"/>
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="confirmeff">
      <q-card class="bs">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn flat :label="$t('CHeffcf')" color="warning" @click="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="chatedit">
      <q-card>
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn flat :label="$t('valider')" color="warning" @click="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

</q-layout>
</template>
<script>

import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import SdDark1 from './SdDark1.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool, dkli } from '../app/util.mjs'
import BoutonHelp from './BoutonHelp.vue'
import { ItemChatgr } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuChat',

  props: { },

  components: { SdDark1, EditeurMd, BoutonHelp },

  computed: { 
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    egr () { return this.gSt.egrC },
    // Map: cle:im, val:na de l'avc
    imNa () { return this.aSt.compte.imNaGroupe(this.egr.groupe.id) }
  },

  data () { return {
    txt: '',
    im: 0,
    dh: 0
  }},

  methods: {
    membre (im) { return this.egr.membres.get(im) },

    async effacer (im, dh) {
      if (!await this.session.edit()) return
      this.im = im
      this.dh = dh
      this.ovconfirmeff()
    },

    async effop () {
      await new ItemChatgr().run(this.im, this.dh, null)
      this.im = 0
      this.dh = 0
      MD.fD()
    },

    async addop () {
      await new ItemChatgr().run(0, 0, this.txt)
      this.txt = ''
      MD.fD()
    },

    async editer () {
      if (!await this.session.edit()) return
      this.txt = ''
      this.ovchatedit()
    }
  },

  setup () {
    const session = stores.session
    const gSt = stores.groupe
    const aSt = stores.avatar

    const chatedit = ref(false)
    function ovchatedit () { MD.oD(chatedit) }
    const confirmeff = ref(false)
    function ovconfirmeff () { MD.oD(confirmeff) }

    return {
      MD, chatedit, ovchatedit, confirmeff, ovconfirmeff,
      dkli, dhcool,
      session, gSt, aSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 0 !important
  width: 1.5rem !important
.btn
  min-height: 1.5rem !important
  max-height: 1.5rem !important
</style>
