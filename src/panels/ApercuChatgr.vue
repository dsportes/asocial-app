<template>
<q-dialog v-model="ui.d.ACGouvrir" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHGtit', [groupe.na.nomc])}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar inset>
        <note-ecritepar :groupe="groupe" optmb @ok="selAut"/>
        <q-space/>
        <q-btn :label="$t('CHGadd')" class="btn" icon="add" color="primary"
          padding="xs xs" :disable="!naAut" @click="editer"/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-card class="q-pa-sm">
        <div v-for="it in items" :key="it.dh + '/' + it.im">
          <q-chat-message :sent="imNa(it.im) !== undefined" 
            :bg-color="imNa(it.im) ? 'primary' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-dark1 v-if="!it.dhx" :texte="it.t"/>
            <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{imNa(it.im) ? imNa(it.im).nom : membre(it.im).na.nomc }}</span>
                <q-btn v-if="(imNa(it.im) || egr.estAnim) && !it.dfx" size="sm" 
                  icon="clear" color="warning" padding="none" round
                  @click="effacer(it.im, it.dh)"/>
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d.ACGconfirmeff">
      <q-card :class="styp()">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
          <q-btn flat :label="$t('CHeffcf')" color="warning" @click="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d.ACGchatedit">
      <q-card :class="styp()">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
          <q-btn flat :label="$t('valider')" color="warning" @click="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

</q-layout>
</q-dialog>
</template>
<script>

import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import SdDark1 from '../components/SdDark1.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, dhcool, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NoteEcritepar from '../dialogues/NoteEcritepar.vue'
import { ItemChatgr } from '../app/operations.mjs'

export default {
  name: 'ApercuChat',

  props: { },

  components: { SdDark1, EditeurMd, BoutonHelp, NoteEcritepar },

  computed: { 
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    egr () { return this.gSt.egrC },
    // Map: cle:im, val:na de l'avc
    imNa1 () { return this.aSt.compte.imNaGroupe(this.egr.groupe.id) },
    groupe () { return this.egr.groupe },
    items () { return this.gSt.chatgr && this.gSt.chatgr.items ? this.gSt.chatgr.items : []}
  },

  data () { return {
    txt: '',
    im: 0,
    dh: 0
  }},

  methods: {
    membre (im) { return this.egr.membres.get(im) },

    imNa (im) { return this.imNa1.get(im)},

    async effacer (im, dh) {
      if (!await this.session.edit()) return
      this.im = im
      this.dh = dh
      this.ui.oD('ACGconfirmeff')
    },

    async effop () {
      await new ItemChatgr().run(this.groupe.id, this.im, this.dh, null)
      this.im = 0
      this.dh = 0
      this.ui.fD()
    },

    async addop () {
      await new ItemChatgr().run(this.groupe.id, this.imAut, 0, this.txt)
      this.txt = ''
      this.ui.fD()
    },

    async editer () {
      if (!await this.session.edit()) return
      this.txt = ''
      this.ui.oD('ACGchatedit')
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const aSt = stores.avatar
    const naAut = ref()
    const imAut = ref()

    function selAut(elt) {
      naAut.value = elt.na
      imAut.value = elt.im
    }

    return {
      selAut, naAut, imAut,
      styp, dkli, dhcool,
      session, ui, gSt, aSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.nom
  max-height: 1.3rem
  overflow: hidden
</style>
