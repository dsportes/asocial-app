<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div class="row justify-end">
        <div v-if="chat.z" class="text-negative text-bold">{{$t('supprime')}}</div>
        <div v-else class="font-mono fs-md">{{dhcool(chat.dh)}}</div>
      </div>
      <apercu-people class="bordb" :id="chat.naE.id" :idx="idx"/>
      <apercu-motscles :groupe-id="0" @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
        :mapmc="mapmc" :edit="session.auts(3, true)" :src="chat.mc || u0"/>
      <div v-if="!chat.z" class="row items-start">
        <show-html class="col q-mr-sm bord" :idx="idx" zoom maxh="3rem" :texte="chat.txt"/>
        <div class="col-auto self-start"><q-btn class="btn1" icon="edit" size="sm" color="warning" @click="editer"/></div>
      </div>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="chatedit" persistent>
      <q-card class="moyennelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CHtxt')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="chatedit=false"/>
        </q-toolbar>
        <editeur-md ref="memoed" style="height:70vh"
          :texte="chat.txt" editable modetxt :label-ok="$t('OK')" @ok="chatok"/>
      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool } from '../app/util.mjs'
import { getNg } from '../app/modele.mjs'
import ApercuMotscles from './ApercuMotscles.vue'
import ApercuPeople from './ApercuPeople.vue'
import { MajMotsclesChat, MajTexteChat } from '../app/operations.mjs'

export default {
  name: 'ApercuChat',

  props: { id: Number, ids: Number, idx: Number, mapmc: Object },
  /* Compilé: { id (avatar), dh, naE, txt } */

  components: { ShowHtml, EditeurMd, ApercuMotscles, ApercuPeople },

  computed: { },

  data () { return {
    u0: new Uint8Array([]),
    chatedit: false,
    dhcool: dhcool
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (await this.session.aut(3, true)) this.chatedit = true
    },
    async chatok (txt) {
      await new MajTexteChat().run(this.chat, txt)
      this.chatedit = false
    },
    async changeMc (mc) {
      await new MajMotsclesChat().run(this.id, this.ids, mc)
    }
  },

  setup (props) {
    const session = stores.session
    const avStore = stores.avatar
    const id = toRef(props, 'id')
    const ids = toRef(props, 'ids')
    const naI = getNg(id.value)

    function getC () {
      const c = avStore.getChat(id.value, ids.value)
      return c || { id: naI.id, z: true }
    }

    const chat = ref(getC())

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setChat' && args[0].id === id.value && args[0].ids === ids.value) ||
          (name === 'delChat' && args[0] === id.value && args[1] === ids.value)){
          chat.value = getC()
        }
      })
    })

    return {
      session,
      naI,
      chat
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
</style>
